import { useAuth } from "@/context/AuthContext";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { ImagePlus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { supabase } from "@/lib/supabase";
import type { Tables, TablesInsert } from "@/types/supabase.types";

type Club = Tables<"clubs">;
type Team = Tables<"teams">;
type ProfileInsert = TablesInsert<"profiles">;

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];

function RegisterPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const completingProfile = searchParams.get("complete") === "1" && !!user;

  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [location, setLocation] = useState("");

  const [instagramUrl, setInstagramUrl] = useState("");
  const [fiba3x3Url, setFiba3x3Url] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");

  const [clubId, setClubId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [hasClub, setHasClub] = useState<boolean | null>(null);

  const [clubs, setClubs] = useState<Club[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);

  const [isLoadingClubs, setIsLoadingClubs] = useState(true);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadClubs = async () => {
      const { data, error: clubsError } = await supabase
        .from("clubs")
        .select("*")
        .order("name");

      if (clubsError) {
        setError("Vereine konnten nicht geladen werden.");
      } else {
        setClubs(data ?? []);
      }

      setIsLoadingClubs(false);
    };

    void loadClubs();
  }, []);

  useEffect(() => {
    const loadTeams = async () => {
      if (!clubId) {
        setTeams([]);
        setTeamId("");
        return;
      }

      setIsLoadingTeams(true);
      setTeamId("");

      const { data, error: teamsError } = await supabase
        .from("teams")
        .select("*")
        .eq("club_id", clubId)
        .order("name");

      if (teamsError) {
        setError("Mannschaften konnten nicht geladen werden.");
        setTeams([]);
      } else {
        setTeams(data ?? []);
      }

      setIsLoadingTeams(false);
    };

    void loadTeams();
  }, [clubId]);

  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setError(null);

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      setError("Bitte wähle ein JPG-, PNG- oder WebP-Bild aus.");

      event.target.value = "";
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      setError("Das Profilbild darf maximal 5 MB groß sein.");

      event.target.value = "";
      return;
    }

    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
    }

    const previewUrl = URL.createObjectURL(file);

    setAvatarFile(file);
    setAvatarPreview(previewUrl);
  };

  const removeAvatar = () => {
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
    }

    setAvatarFile(null);
    setAvatarPreview(null);

    if (avatarInputRef.current) {
      avatarInputRef.current.value = "";
    }
  };

  const uploadAvatar = async (userId: string, file: File): Promise<string> => {
    const extension = getFileExtension(file);

    const filePath = `${userId}/avatar-${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      throw new Error("Das Profilbild konnte nicht hochgeladen werden.");
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(filePath);

    return publicUrl;
  };

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setIsLoading(true);
    setError(null);

    if (hasClub === null) {
      setError("Bitte gib an, ob du einem Verein angehörst.");
      setIsLoading(false);
      return;
    }

    if (hasClub && !clubId) {
      setError("Bitte wähle deinen Verein aus.");
      setIsLoading(false);
      return;
    }

    if (hasClub && !teamId) {
      setError("Bitte wähle deine Mannschaft aus.");
      setIsLoading(false);
      return;
    }

    const { data: authData, error: signUpError } = completingProfile
      ? { data: { user }, error: null }
      : await supabase.auth.signUp({ email: email.trim(), password });

    if (signUpError) {
      setError(signUpError.message);
      setIsLoading(false);
      return;
    }

    if (!authData.user) {
      setError("Der Benutzer konnte nicht erstellt werden.");
      setIsLoading(false);
      return;
    }

    /*
     * Das Profil wird zunächst ohne Bild angelegt.
     * Danach laden wir das Bild hoch und aktualisieren
     * avatar_url.
     */
    const profile: ProfileInsert = {
      id: authData.user.id,
      username: `player_${authData.user.id.replaceAll("-", "")}`,
      display_name: `${firstName.trim()} ${lastName.trim()}`,
      avatar_url: "",
      basketball_position: "",
      bio: "",
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: completingProfile ? (user.email ?? null) : email.trim(),
      birth_date: birthDate,
      location: location.trim(),
      instagram_url: instagramUrl.trim() || null,
      fiba_3x3_url: fiba3x3Url.trim() || null,
      youtube_url: youtubeUrl.trim() || null,
      tiktok_url: tiktokUrl.trim() || null,
      club_id: clubId || null,
      team_id: teamId || null,
    };

    const { data: existingProfile, error: lookupError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", authData.user.id)
      .maybeSingle();
    if (lookupError) {
      setError(lookupError.message);
      setIsLoading(false);
      return;
    }
    const { error: profileError } = existingProfile
      ? await supabase
          .from("profiles")
          .update({
            first_name: profile.first_name,
            last_name: profile.last_name,
            birth_date: profile.birth_date,
            location: profile.location,
            instagram_url: profile.instagram_url,
            fiba_3x3_url: profile.fiba_3x3_url,
            youtube_url: profile.youtube_url,
            tiktok_url: profile.tiktok_url,
            club_id: profile.club_id,
            team_id: profile.team_id,
          })
          .eq("id", authData.user.id)
      : await supabase.from("profiles").insert(profile);

    if (profileError) {
      setError(profileError.message);
      setIsLoading(false);
      return;
    }

    if (avatarFile) {
      try {
        const avatarUrl = await uploadAvatar(authData.user.id, avatarFile);

        const { error: avatarUpdateError } = await supabase
          .from("profiles")
          .update({
            avatar_url: avatarUrl,
          })
          .eq("id", authData.user.id);

        if (avatarUpdateError) {
          setError(
            "Dein Account wurde erstellt, aber das Profilbild konnte nicht gespeichert werden."
          );
          setIsLoading(false);
          return;
        }
      } catch (avatarError) {
        setError(
          avatarError instanceof Error
            ? avatarError.message
            : "Das Profilbild konnte nicht hochgeladen werden."
        );

        setIsLoading(false);
        return;
      }
    }

    navigate("/courts", { replace: true });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {completingProfile
              ? "Profil vervollständigen"
              : "Account erstellen"}
          </CardTitle>

          <CardDescription>
            Erstelle dein persönliches Basketball-Profil.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* {!completingProfile && <SocialAuthButtons disabled={isLoading} />} */}
          <form onSubmit={handleRegister} className="space-y-6">
            {!completingProfile && (
              <section className="space-y-4">
                <div>
                  <h2 className="font-semibold">Account</h2>

                  <p className="text-sm text-muted-foreground">
                    Deine Zugangsdaten für BallerzHub.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-Mail</Label>

                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="name@example.com"
                    autoComplete="email"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Passwort</Label>

                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Mindestens 6 Zeichen"
                    autoComplete="new-password"
                    minLength={6}
                    required
                  />
                </div>
              </section>
            )}

            <section className="space-y-4">
              <div>
                <h2 className="font-semibold">Profilbild</h2>

                <p className="text-sm text-muted-foreground">
                  Optional kannst du direkt ein Profilbild hochladen.
                </p>
              </div>

              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Vorschau des Profilbilds"
                      className="size-28 rounded-full object-cover ring-2 ring-border"
                    />
                  ) : (
                    <div className="flex size-28 items-center justify-center rounded-full border-2 border-dashed bg-muted">
                      <ImagePlus className="size-8 text-muted-foreground" />
                    </div>
                  )}

                  {avatarPreview && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 size-7 rounded-full"
                      onClick={removeAvatar}
                      aria-label="Profilbild entfernen"
                    >
                      <X className="size-4" />
                    </Button>
                  )}
                </div>

                <div className="flex flex-col items-center gap-2">
                  <input
                    ref={avatarInputRef}
                    id="avatar"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => avatarInputRef.current?.click()}
                  >
                    <ImagePlus className="size-4" />
                    {avatarFile ? "Bild ändern" : "Profilbild auswählen"}
                  </Button>

                  <p className="text-center text-xs text-muted-foreground">
                    JPG, PNG oder WebP · maximal 5 MB
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div>
                <h2 className="font-semibold">Persönliche Daten</h2>

                <p className="text-sm text-muted-foreground">
                  Diese Angaben gehören zu deinem Profil.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Vorname</Label>

                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    placeholder="Vorname"
                    autoComplete="given-name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Nachname</Label>

                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    placeholder="Nachname"
                    autoComplete="family-name"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthDate">Geburtsdatum</Label>

                <Input
                  id="birthDate"
                  type="date"
                  value={birthDate}
                  onChange={(event) => setBirthDate(event.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Wohnort</Label>

                <Input
                  id="location"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder="z. B. Mönchengladbach"
                  autoComplete="address-level2"
                  required
                />
              </div>
            </section>

            <section className="space-y-4">
              <div>
                <h2 className="font-semibold">Social Media</h2>

                <p className="text-sm text-muted-foreground">
                  Verknüpfe deine Basketball- und Social-Media-Profile.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="instagramUrl">Instagram</Label>

                <Input
                  id="instagramUrl"
                  type="url"
                  value={instagramUrl}
                  onChange={(event) => setInstagramUrl(event.target.value)}
                  placeholder="https://instagram.com/..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fiba3x3Url">FIBA 3x3</Label>

                <Input
                  id="fiba3x3Url"
                  type="url"
                  value={fiba3x3Url}
                  onChange={(event) => setFiba3x3Url(event.target.value)}
                  placeholder="https://play.fiba3x3.com/..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="youtubeUrl">YouTube</Label>

                <Input
                  id="youtubeUrl"
                  type="url"
                  value={youtubeUrl}
                  onChange={(event) => setYoutubeUrl(event.target.value)}
                  placeholder="https://youtube.com/..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tiktokUrl">TikTok</Label>

                <Input
                  id="tiktokUrl"
                  type="url"
                  value={tiktokUrl}
                  onChange={(event) => setTiktokUrl(event.target.value)}
                  placeholder="https://tiktok.com/@..."
                />
              </div>
            </section>

            <section className="space-y-4">
              <div className="space-y-2">
                <Label>Gehörst du einem Verein an?</Label>

                <Select
                  value={hasClub === null ? "" : hasClub ? "yes" : "no"}
                  onValueChange={(value) => {
                    const belongsToClub = value === "yes";

                    setHasClub(belongsToClub);

                    if (!belongsToClub) {
                      setClubId("");
                      setTeamId("");
                      setTeams([]);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Bitte auswählen" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="yes">Ja</SelectItem>

                    <SelectItem value="no">Nein</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {hasClub && (
                <>
                  <div className="space-y-2">
                    <Label>Verein</Label>

                    <Select value={clubId} onValueChange={(value) => setClubId(value ?? "")}>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            isLoadingClubs
                              ? "Vereine werden geladen ..."
                              : "Verein auswählen"
                          }
                        />
                      </SelectTrigger>

                      <SelectContent>
                        {clubs.map((club) => (
                          <SelectItem key={club.id} value={club.id}>
                            {club.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Mannschaft</Label>

                    <Select
                      value={teamId}
                      onValueChange={(value) => setTeamId(value ?? "")}
                      disabled={!clubId || isLoadingTeams}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            !clubId
                              ? "Zuerst Verein auswählen"
                              : isLoadingTeams
                                ? "Mannschaften werden geladen ..."
                                : "Mannschaft auswählen"
                          }
                        />
                      </SelectTrigger>

                      {clubId && (
                        <SelectContent>
                          {teams.map((team) => (
                            <SelectItem key={team.id} value={team.id}>
                              {team.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      )}
                    </Select>
                  </div>
                </>
              )}
            </section>

            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || isLoadingClubs || isLoadingTeams}
            >
              {isLoading
                ? "Wird gespeichert …"
                : completingProfile
                  ? "Profil speichern"
                  : "Registrieren"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Bereits registriert?{" "}
              <Link
                to="/login"
                className="font-medium text-foreground underline"
              >
                Einloggen
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

function getFileExtension(file: File) {
  switch (file.type) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "jpg";
  }
}

export default RegisterPage;

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";

import { ArrowLeft, ImagePlus, X } from "lucide-react";
import { FaInstagram, FaTiktok, FaYoutube } from "react-icons/fa";

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
import { Skeleton } from "@/components/ui/skeleton";

import { supabase } from "@/lib/supabase";
import type { Tables, TablesUpdate } from "@/types/supabase.types";

type Profile = Tables<"profiles">;
type Club = Tables<"clubs">;
type Team = Tables<"teams">;

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];

function ProfileEditPage() {
  const navigate = useNavigate();

  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const [profile, setProfile] = useState<Profile | null>(null);

  const [clubs, setClubs] = useState<Club[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [location, setLocation] = useState("");

  const [instagramUrl, setInstagramUrl] = useState("");
  const [fiba3x3Url, setFiba3x3Url] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");

  const [clubId, setClubId] = useState("");
  const [teamId, setTeamId] = useState("");

  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const selectedClubName = clubs.find((club) => club.id === clubId)?.name;
  const selectedTeamName = teams.find((team) => team.id === teamId)?.name;

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/login", { replace: true });
        return;
      }

      const [profileResult, clubsResult] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),

        supabase.from("clubs").select("*").order("name", {
          ascending: true,
        }),
      ]);

      if (profileResult.error) {
        setError("Dein Profil konnte nicht geladen werden.");
        setIsLoading(false);
        return;
      }

      if (!profileResult.data) {
        setError("Für deinen Account wurde kein Profil gefunden.");
        setIsLoading(false);
        return;
      }

      if (clubsResult.error) {
        setError("Die Vereine konnten nicht geladen werden.");
        setIsLoading(false);
        return;
      }

      const profileData = profileResult.data;

      setProfile(profileData);
      setClubs(clubsResult.data ?? []);

      setFirstName(profileData.first_name ?? "");
      setLastName(profileData.last_name ?? "");
      setBirthDate(profileData.birth_date ?? "");
      setLocation(profileData.location ?? "");

      setInstagramUrl(profileData.instagram_url ?? "");
      setFiba3x3Url(profileData.fiba_3x3_url ?? "");
      setYoutubeUrl(profileData.youtube_url ?? "");
      setTiktokUrl(profileData.tiktok_url ?? "");

      setClubId(profileData.club_id ?? "");
      setTeamId(profileData.team_id ?? "");

      setCurrentAvatarUrl(profileData.avatar_url || null);

      if (profileData.club_id) {
        setIsLoadingTeams(true);

        const { data: teamData, error: teamError } = await supabase
          .from("teams")
          .select("*")
          .eq("club_id", profileData.club_id)
          .order("name", {
            ascending: true,
          });

        if (!teamError) {
          setTeams(teamData ?? []);
        }

        setIsLoadingTeams(false);
      }

      setIsLoading(false);
    };

    void loadData();
  }, [navigate]);

  useEffect(() => {
    if (isLoading || !clubId) {
      if (!clubId) {
        setTeams([]);
        setTeamId("");
      }

      return;
    }

    const loadTeams = async () => {
      setIsLoadingTeams(true);

      const { data, error: teamsError } = await supabase
        .from("teams")
        .select("*")
        .eq("club_id", clubId)
        .order("name", {
          ascending: true,
        });

      if (teamsError) {
        setTeams([]);
        setTeamId("");
        setIsLoadingTeams(false);
        return;
      }

      setTeams(data ?? []);

      const selectedTeamStillExists = data?.some((team) => team.id === teamId);

      if (!selectedTeamStillExists) {
        setTeamId("");
      }

      setIsLoadingTeams(false);
    };

    void loadTeams();
  }, [clubId, isLoading, teamId]);

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

    setSaveError(null);

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      setSaveError("Bitte wähle ein JPG-, PNG- oder WebP-Bild aus.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      setSaveError("Das Profilbild darf maximal 5 MB groß sein.");
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

  const removeNewAvatar = () => {
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
      throw new Error("Das neue Profilbild konnte nicht hochgeladen werden.");
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(filePath);

    return publicUrl;
  };

  const deleteOldAvatar = async (avatarUrl: string | null) => {
    if (!avatarUrl) {
      return;
    }

    const marker = "/storage/v1/object/public/avatars/";
    const markerIndex = avatarUrl.indexOf(marker);

    if (markerIndex === -1) {
      return;
    }

    const filePath = avatarUrl.substring(markerIndex + marker.length);

    if (!filePath) {
      return;
    }

    await supabase.storage.from("avatars").remove([filePath]);
  };

  const handleClubChange = (value: string) => {
    setClubId(value === "none" ? "" : value);
    setTeamId("");
    setTeams([]);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setSaveError(null);

    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedLocation = location.trim();

    if (!trimmedFirstName) {
      setSaveError("Bitte gib deinen Vornamen ein.");
      return;
    }

    if (!trimmedLastName) {
      setSaveError("Bitte gib deinen Nachnamen ein.");
      return;
    }

    if (!birthDate) {
      setSaveError("Bitte gib dein Geburtsdatum ein.");
      return;
    }

    if (!trimmedLocation) {
      setSaveError("Bitte gib deinen Wohnort ein.");
      return;
    }

    if (!profile) {
      setSaveError("Dein Profil konnte nicht geladen werden.");
      return;
    }

    setIsSaving(true);

    let newAvatarUrl: string | null = null;

    try {
      if (avatarFile) {
        newAvatarUrl = await uploadAvatar(profile.id, avatarFile);
      }

      const updates: TablesUpdate<"profiles"> = {
        first_name: trimmedFirstName,
        last_name: trimmedLastName,
        birth_date: birthDate || null,
        location: trimmedLocation,

        instagram_url: instagramUrl.trim() || null,
        fiba_3x3_url: fiba3x3Url.trim() || null,
        youtube_url: youtubeUrl.trim() || null,
        tiktok_url: tiktokUrl.trim() || null,

        club_id: clubId || null,
        team_id: teamId || null,
      };

      if (newAvatarUrl) {
        updates.avatar_url = newAvatarUrl;
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", profile.id);

      if (updateError) {
        if (newAvatarUrl) {
          await deleteOldAvatar(newAvatarUrl);
        }

        throw new Error("Dein Profil konnte nicht gespeichert werden.");
      }

      if (
        newAvatarUrl &&
        currentAvatarUrl &&
        currentAvatarUrl !== newAvatarUrl
      ) {
        await deleteOldAvatar(currentAvatarUrl);
      }

      navigate("/profile", {
        replace: true,
      });
    } catch (submitError) {
      setSaveError(
        submitError instanceof Error
          ? submitError.message
          : "Dein Profil konnte nicht gespeichert werden."
      );

      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <main className="container mx-auto max-w-2xl px-4 py-6">
        <Skeleton className="mb-6 h-9 w-40" />

        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>

          <CardContent className="space-y-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="container mx-auto max-w-2xl px-4 py-6">
        <Card>
          <CardContent className="p-6">
            <h1 className="text-lg font-semibold">
              Profil konnte nicht geladen werden
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              {error ?? "Unbekannter Fehler."}
            </p>

            <Button
              asChild
              variant="link"
              className="mt-4"
              onClick={() => navigate(-1)}
            >
              <span className="inline-flex items-center gap-2">
                <ArrowLeft className="size-5 shrink-0" />
                <span>Zurück</span>
              </span>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const displayedAvatar = avatarPreview ?? currentAvatarUrl;

  return (
    <main className="container mx-auto max-w-2xl px-4 py-6">
      <Button
        asChild
        variant="link"
        className="mt-4"
        onClick={() => navigate(-1)}
      >
        <span className="inline-flex items-center gap-2">
          <ArrowLeft className="size-5 shrink-0" />
          <span>Zurück</span>
        </span>
      </Button>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Profil bearbeiten</CardTitle>

          <CardDescription>
            Aktualisiere deine persönlichen und basketballbezogenen Angaben.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            <section className="space-y-5">
              <div>
                <h2 className="font-semibold">Profilbild</h2>

                <p className="text-sm text-muted-foreground">
                  Lade ein neues Profilbild hoch, wenn du dein aktuelles Bild
                  ändern möchtest.
                </p>
              </div>

              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  {displayedAvatar ? (
                    <img
                      src={displayedAvatar}
                      alt="Profilbild"
                      className="size-32 rounded-full object-cover ring-2 ring-border"
                    />
                  ) : (
                    <div className="flex size-32 items-center justify-center rounded-full border-2 border-dashed bg-muted">
                      <ImagePlus className="size-9 text-muted-foreground" />
                    </div>
                  )}

                  {avatarPreview && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 size-7 rounded-full"
                      onClick={removeNewAvatar}
                      aria-label="Neues Profilbild entfernen"
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
                    {avatarFile
                      ? "Bild ändern"
                      : currentAvatarUrl
                        ? "Neues Bild auswählen"
                        : "Profilbild auswählen"}
                  </Button>

                  <p className="text-center text-xs text-muted-foreground">
                    JPG, PNG oder WebP · maximal 5 MB
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-5">
              <div>
                <h2 className="font-semibold">Persönliche Daten</h2>

                <p className="text-sm text-muted-foreground">
                  Diese Angaben werden in deinem Profil angezeigt.
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
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

            <section className="space-y-5">
              <div>
                <h2 className="font-semibold">Basketball</h2>

                <p className="text-sm text-muted-foreground">
                  Verein und Mannschaft sind optional.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="club">Verein</Label>

                <Select
                  value={clubId || "none"}
                  onValueChange={handleClubChange}
                >
                  <SelectTrigger id="club">
                    <SelectValue placeholder="Verein auswählen">
                      {selectedClubName}
                    </SelectValue>
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="none">Kein Verein</SelectItem>

                    {clubs.map((club) => (
                      <SelectItem key={club.id} value={club.id}>
                        {club.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="team">Mannschaft</Label>

                <Select
                  value={teamId || "none"}
                  onValueChange={(value) =>
                    setTeamId(value === "none" ? "" : value)
                  }
                  disabled={!clubId || isLoadingTeams}
                >
                  <SelectTrigger id="team">
                    <SelectValue
                      placeholder={
                        !clubId
                          ? "Zuerst Verein auswählen"
                          : isLoadingTeams
                            ? "Mannschaften werden geladen..."
                            : "Mannschaft auswählen"
                      }
                    >
                      {selectedTeamName}
                    </SelectValue>
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="none">Keine Mannschaft</SelectItem>

                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {!clubId && (
                  <p className="text-xs text-muted-foreground">
                    Eine Mannschaft kann nur ausgewählt werden, wenn ein Verein
                    hinterlegt ist.
                  </p>
                )}
              </div>
            </section>

            <section className="space-y-5">
              <div>
                <h2 className="font-semibold">Social Media</h2>

                <p className="text-sm text-muted-foreground">
                  Diese Angaben sind optional.
                </p>
              </div>

              <SocialInput
                id="instagramUrl"
                label="Instagram"
                icon={<FaInstagram className="size-5" />}
                value={instagramUrl}
                onChange={setInstagramUrl}
                placeholder="https://instagram.com/..."
              />

              <SocialInput
                id="fiba3x3Url"
                label="FIBA 3x3"
                icon={
                  <span className="text-[10px] font-bold tracking-tight">
                    3x3
                  </span>
                }
                value={fiba3x3Url}
                onChange={setFiba3x3Url}
                placeholder="https://play.fiba3x3.com/..."
              />

              <SocialInput
                id="youtubeUrl"
                label="YouTube"
                icon={<FaYoutube className="size-5" />}
                value={youtubeUrl}
                onChange={setYoutubeUrl}
                placeholder="https://youtube.com/..."
              />

              <SocialInput
                id="tiktokUrl"
                label="TikTok"
                icon={<FaTiktok className="size-5" />}
                value={tiktokUrl}
                onChange={setTiktokUrl}
                placeholder="https://tiktok.com/@..."
              />
            </section>

            {saveError && (
              <div
                role="alert"
                className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
              >
                {saveError}
              </div>
            )}

            <div className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/profile")}
                disabled={isSaving}
              >
                Abbrechen
              </Button>

              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Wird gespeichert..." : "Änderungen speichern"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

type SocialInputProps = {
  id: string;
  label: string;
  icon: ReactNode;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
};

function SocialInput({
  id,
  label,
  icon,
  value,
  onChange,
  placeholder,
}: SocialInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>

      <div className="relative">
        <div className="absolute top-1/2 left-3 flex size-5 -translate-y-1/2 items-center justify-center text-muted-foreground">
          {icon}
        </div>

        <Input
          id={id}
          type="url"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="pl-10"
        />
      </div>
    </div>
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

export default ProfileEditPage;

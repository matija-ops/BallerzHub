import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";

import { ArrowLeft, ExternalLink } from "lucide-react";
import { FaInstagram, FaTiktok, FaYoutube } from "react-icons/fa";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import { supabase } from "@/lib/supabase";
import type { Tables } from "@/types/supabase.types";
import ProfileTeamOverview from "@/components/profile/ProfileTeamOverview";

type Profile = Tables<"profiles">;
type Club = Tables<"clubs">;
type Team = Tables<"teams">;

function ProfilePage() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [club, setClub] = useState<Club | null>(null);
  const [team, setTeam] = useState<Team | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/login", { replace: true });
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        setError("Dein Profil konnte nicht geladen werden.");
        setIsLoading(false);
        return;
      }

      if (!profileData) {
        setError("Für deinen Account wurde kein Profil gefunden.");
        setIsLoading(false);
        return;
      }

      setProfile(profileData);

      if (profileData.club_id) {
        const { data: clubData, error: clubError } = await supabase
          .from("clubs")
          .select("*")
          .eq("id", profileData.club_id)
          .maybeSingle();

        if (!clubError) {
          setClub(clubData);
        }
      }

      if (profileData.team_id) {
        const { data: teamData, error: teamError } = await supabase
          .from("teams")
          .select("*")
          .eq("id", profileData.team_id)
          .maybeSingle();

        if (!teamError) {
          setTeam(teamData);
        }
      }

      setIsLoading(false);
    };

    void loadProfile();
  }, [navigate]);

  if (isLoading) {
    return (
      <main className="container mx-auto max-w-2xl px-4 py-6">
        <Skeleton className="mb-6 h-9 w-40" />

        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>

          <CardContent className="space-y-5">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-48" />
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
              type="button"
              variant="outline"
              className="mt-4"
              onClick={() => navigate("/courts")}
            >
              Zurück zu den Courts
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const fullName =
    [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
    "Mein Profil";

  return (
    <main className="container mx-auto max-w-2xl px-4 py-6">
      <Button
        type="button"
        variant="ghost"
        className="mb-4 -ml-2"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="size-4" />
        Zurück
      </Button>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="shrink-0">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={`Profilbild von ${fullName}`}
                    className="size-24 rounded-full object-cover ring-2 ring-border"
                  />
                ) : (
                  <div
                    className="size-24 rounded-full border-2 border-border bg-transparent"
                    aria-label="Kein Profilbild vorhanden"
                  />
                )}
              </div>

              <div className="min-w-0">
                <CardTitle className="text-2xl break-words">
                  {fullName}
                </CardTitle>

                <CardDescription className="mt-1">
                  Dein persönliches Basketball-Profil
                </CardDescription>
              </div>
            </div>

            <Button asChild variant="outline" className="shrink-0">
              <Link to="/profile/edit">Profil bearbeiten</Link>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <section className="space-y-4">
            <h2 className="font-semibold">Persönliche Daten</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <ProfileField label="Vorname" value={profile.first_name} />

              <ProfileField label="Nachname" value={profile.last_name} />

              <ProfileField label="E-Mail" value={profile.email} />

              <ProfileField
                label="Geburtsdatum"
                value={formatDate(profile.birth_date)}
              />

              <ProfileField label="Wohnort" value={profile.location} />
            </div>
          </section>

          <Separator />

          <section className="space-y-4">
            <h2 className="font-semibold">Basketball</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <ProfileField
                label="Verein"
                value={club?.name ?? "Kein Verein hinterlegt"}
              />

              <ProfileField
                label="Mannschaft"
                value={team?.name ?? "Keine Mannschaft hinterlegt"}
              />
            </div>
          </section>

          <Separator />

          <section className="space-y-4">
            <h2 className="font-semibold">Social Media</h2>

            <div className="space-y-3">
              <SocialLink
                icon={<FaInstagram className="size-5" />}
                label="Instagram"
                url={profile.instagram_url}
              />

              <SocialLink
                icon={
                  <span className="text-[10px] font-bold tracking-tight">
                    3x3
                  </span>
                }
                label="FIBA 3x3"
                url={profile.fiba_3x3_url}
              />

              <SocialLink
                icon={<FaYoutube className="size-5" />}
                label="YouTube"
                url={profile.youtube_url}
              />

              <SocialLink
                icon={<FaTiktok className="size-5" />}
                label="TikTok"
                url={profile.tiktok_url}
              />
            </div>
          </section>
        </CardContent>
      </Card>

      {profile.team_id && (
        <div className="mt-6">
          <ProfileTeamOverview teamId={profile.team_id} />
        </div>
      )}
    </main>
  );
}

type ProfileFieldProps = {
  label: string;
  value: string | null;
};

function ProfileField({ label, value }: ProfileFieldProps) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>

      <p className="mt-1 font-medium">{value || "Nicht angegeben"}</p>
    </div>
  );
}

type SocialLinkProps = {
  icon: ReactNode;
  label: string;
  url: string | null;
};

function SocialLink({ icon, label, url }: SocialLinkProps) {
  if (!url) {
    return (
      <div className="flex items-center justify-between rounded-lg border p-3">
        <div className="flex items-center gap-3">
          <div className="flex size-5 items-center justify-center text-muted-foreground">
            {icon}
          </div>

          <span className="font-medium">{label}</span>
        </div>

        <span className="text-sm text-muted-foreground">Nicht hinterlegt</span>
      </div>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted"
    >
      <div className="flex items-center gap-3">
        <div className="flex size-5 items-center justify-center text-muted-foreground">
          {icon}
        </div>

        <span className="font-medium">{label}</span>
      </div>

      <ExternalLink className="size-4 text-muted-foreground" />
    </a>
  );
}

function formatDate(date: string | null) {
  if (!date) {
    return null;
  }

  return new Intl.DateTimeFormat("de-DE").format(new Date(`${date}T00:00:00`));
}

export default ProfilePage;

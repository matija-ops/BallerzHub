import { ArrowLeft, Pencil, Plus } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";

import type { Tables } from "@/lib/supabase";
import { supabase } from "@/lib/supabase";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type Club = Tables<"clubs">;
type Team = Tables<"teams">;

function ClubDetailPage() {
  const { clubId } = useParams<{ clubId: string }>();
  const navigate = useNavigate();

  const [club, setClub] = useState<Club | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clubId) {
      setError("Kein Verein angegeben.");
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    async function fetchClub() {
      setIsLoading(true);
      setError(null);

      const [clubResult, teamsResult] = await Promise.all([
        supabase.from("clubs").select("*").eq("id", clubId!).single(),

        supabase
          .from("teams")
          .select("*")
          .eq("club_id", clubId!)
          .order("name", { ascending: true }),
      ]);

      if (!isMounted) {
        return;
      }

      if (clubResult.error) {
        console.error("Fehler beim Laden des Vereins:", clubResult.error);

        setClub(null);
        setTeams([]);
        setError("Der Verein konnte nicht geladen werden.");
        setIsLoading(false);
        return;
      }

      if (teamsResult.error) {
        console.error("Fehler beim Laden der Mannschaften:", teamsResult.error);

        setClub(clubResult.data);
        setTeams([]);
        setError("Die Mannschaften konnten nicht geladen werden.");
        setIsLoading(false);
        return;
      }

      setClub(clubResult.data);
      setTeams(teamsResult.data ?? []);
      setIsLoading(false);
    }

    void fetchClub();

    return () => {
      isMounted = false;
    };
  }, [clubId]);

  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-6">
        <Skeleton className="mb-6 h-9 w-40" />

        <section className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 gap-4">
            <Skeleton className="size-24 shrink-0 rounded-lg" />

            <div className="min-w-0 space-y-3">
              <Skeleton className="h-9 w-56" />
              <Skeleton className="h-5 w-80 max-w-full" />
              <Skeleton className="h-5 w-64 max-w-full" />
            </div>
          </div>

          <Skeleton className="h-10 w-48 shrink-0" />
        </section>

        <section className="mt-8">
          <Skeleton className="h-8 w-40" />

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index}>
                <CardContent className="p-5">
                  <Skeleton className="h-6 w-2/3" />
                  <Skeleton className="mt-2 h-5 w-1/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    );
  }

  if (error || !club) {
    return (
      <main className="container mx-auto px-4 py-6">
        <Card>
          <CardContent className="p-6">
            <h1 className="text-lg font-semibold">
              Verein konnte nicht geladen werden
            </h1>

            <p className="mt-2 text-sm text-destructive">
              {error ?? "Der Verein wurde nicht gefunden."}
            </p>

            <Button
              type="button"
              variant="outline"
              className="mt-4"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="size-5 shrink-0" />
              Zurück
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-6">
      <Button
        type="button"
        variant="ghost"
        className="mb-6 text-orange-500 hover:bg-transparent hover:text-orange-400"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="size-5 shrink-0" />
        <span>Zurück</span>
      </Button>

      <div className="space-y-8">
        {/* Vereinsinformationen */}
        <section className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 gap-4">
            <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
              {club.logo_url ? (
                <img
                  src={club.logo_url}
                  alt={`Logo von ${club.name}`}
                  className="size-full object-contain"
                />
              ) : (
                <span className="text-sm font-medium text-muted-foreground">
                  Logo
                </span>
              )}
            </div>

            <div className="min-w-0">
              <h1 className="text-3xl font-bold tracking-tight break-words">
                {club.name}
              </h1>

              {club.description && (
                <p className="mt-2 max-w-3xl break-words text-muted-foreground">
                  {club.description}
                </p>
              )}
            </div>
          </div>

          <Button
            asChild
            variant="outline"
            className="shrink-0 whitespace-nowrap"
          >
            <Link
              to={`/clubs/${club.id}/edit`}
              className="flex items-center gap-2"
            >
              <Pencil className="size-4 shrink-0" />
              <span>Verein bearbeiten</span>
            </Link>
          </Button>
        </section>

        {/* Mannschaften */}
        <section>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Mannschaften
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Mannschaften dieses Vereins
              </p>
            </div>

            <Button asChild className="w-full whitespace-nowrap sm:w-auto">
              <Link
                to={`/clubs/${club.id}/teams/create`}
                className="flex items-center justify-center gap-2"
              >
                <Plus className="size-4 shrink-0" />
                <span>Mannschaft hinzufügen</span>
              </Link>
            </Button>
          </div>

          {teams.length === 0 ? (
            <Card className="mt-4">
              <CardContent className="p-6">
                <h3 className="font-semibold">Keine Mannschaften vorhanden</h3>

                <p className="mt-1 text-sm text-muted-foreground">
                  Für diesen Verein wurden noch keine Mannschaften hinterlegt.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {teams.map((team) => (
                <Link
                  key={team.id}
                  to={`/clubs/${club.id}/teams/${team.id}`}
                  className="block h-full min-w-0"
                >
                  <Card className="h-full min-w-0 transition-colors hover:bg-muted/50">
                    <CardContent className="p-5">
                      <h3 className="text-lg font-semibold break-words">
                        {team.name}
                      </h3>

                      <p className="mt-1 text-sm break-words text-muted-foreground">
                        {team.age_group}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default ClubDetailPage;

import { ArrowLeft, Pencil } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";

import type { Tables } from "@/lib/supabase";
import { supabase } from "@/lib/supabase";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type Team = Tables<"teams">;
type Club = Tables<"clubs">;
type League = Tables<"leagues">;
type Player = Tables<"players">;

function TeamDetailPage() {
  const { clubId, teamId } = useParams<{
    clubId: string;
    teamId: string;
  }>();

  const [team, setTeam] = useState<Team | null>(null);
  const [club, setClub] = useState<Club | null>(null);
  const [league, setLeague] = useState<League | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!clubId || !teamId) {
      setError("Verein oder Mannschaft wurde nicht angegeben.");
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    async function fetchTeamDetail() {
      setIsLoading(true);
      setError(null);

      const teamResult = await supabase
        .from("teams")
        .select("*")
        .eq("id", teamId)
        .eq("club_id", clubId)
        .single();

      if (!isMounted) {
        return;
      }

      if (teamResult.error) {
        console.error("Fehler beim Laden der Mannschaft:", teamResult.error);

        setTeam(null);
        setClub(null);
        setLeague(null);
        setPlayers([]);
        setError("Die Mannschaft konnte nicht geladen werden.");
        setIsLoading(false);
        return;
      }

      const loadedTeam = teamResult.data;

      const [clubResult, leagueResult, playersResult] = await Promise.all([
        supabase
          .from("clubs")
          .select("*")
          .eq("id", loadedTeam.club_id)
          .single(),

        supabase
          .from("leagues")
          .select("*")
          .eq("id", loadedTeam.league_id)
          .single(),

        supabase
          .from("players")
          .select("*")
          .eq("team_id", loadedTeam.id)
          .order("last_name", { ascending: true }),
      ]);

      if (!isMounted) {
        return;
      }

      if (clubResult.error) {
        console.error("Fehler beim Laden des Vereins:", clubResult.error);
      }

      if (leagueResult.error) {
        console.error("Fehler beim Laden der Liga:", leagueResult.error);
      }

      if (playersResult.error) {
        console.error("Fehler beim Laden der Spieler:", playersResult.error);
      }

      setTeam(loadedTeam);
      setClub(clubResult.data ?? null);
      setLeague(leagueResult.data ?? null);
      setPlayers(playersResult.data ?? []);
      setIsLoading(false);
    }

    void fetchTeamDetail();

    return () => {
      isMounted = false;
    };
  }, [clubId, teamId]);

  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <Skeleton className="h-9 w-40" />
        </div>

        <div className="space-y-8">
          <section className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-5 w-32" />
            </div>

            <Skeleton className="h-10 w-52" />
          </section>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>

            <CardContent className="space-y-3">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-5 w-64" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>

            <CardContent className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  if (error || !team) {
    return (
      <main className="container mx-auto px-4 py-6">
        <Card>
          <CardContent className="py-6">
            <p className="text-sm text-destructive">
              {error ?? "Die Mannschaft konnte nicht gefunden werden."}
            </p>

            <Button
              asChild
              variant="link"
              className="mt-4"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft />
              Zurück zum Verein
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <Button
          asChild
          variant="link"
          className="mt-4"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft />
          Zurück zum Verein
        </Button>
      </div>

      <div className="space-y-8">
        {/* Mannschaftsüberschrift */}
        <section className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold tracking-tight break-words">
              {team.name}
            </h1>

            <p className="mt-2 text-muted-foreground">{team.age_group}</p>
          </div>

          <Button
            asChild
            variant="outline"
            className="shrink-0 whitespace-nowrap"
          >
            <Link
              to={`/clubs/${team.club_id}/teams/${team.id}/edit`}
              className="flex items-center gap-2"
            >
              <Pencil className="size-4 shrink-0" />
              <span>Mannschaft bearbeiten</span>
            </Link>
          </Button>
        </section>

        {/* Verein und Liga */}
        <section className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Verein</CardTitle>
            </CardHeader>

            <CardContent>
              {club ? (
                <Link
                  to={`/clubs/${club.id}`}
                  className="-m-3 block rounded-md p-3 transition-colors hover:bg-muted/50"
                >
                  <p className="font-medium">{club.name}</p>

                  {club.description && (
                    <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">
                      {club.description}
                    </p>
                  )}
                </Link>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Verein konnte nicht geladen werden.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Liga</CardTitle>
            </CardHeader>

            <CardContent>
              {league ? (
                <Link
                  to={`/leagues/${league.id}`}
                  className="-m-3 block rounded-md p-3 transition-colors hover:bg-muted/50"
                >
                  <p className="font-medium">{league.name}</p>

                  <div className="mt-1 space-y-1 text-sm text-muted-foreground">
                    {league.season && <p>Saison: {league.season}</p>}

                    {league.age_group && (
                      <p>Altersklasse: {league.age_group}</p>
                    )}

                    {league.division && <p>Division: {league.division}</p>}
                  </div>
                </Link>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Liga konnte nicht geladen werden.
                </p>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Spieler */}
        <section>
          <div className="mb-4">
            <h2 className="text-2xl font-semibold tracking-tight">Spieler</h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Spieler dieser Mannschaft
            </p>
          </div>

          {players.length === 0 ? (
            <Card>
              <CardContent className="py-6">
                <p className="text-sm text-muted-foreground">
                  Für diese Mannschaft sind aktuell keine Spieler hinterlegt.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="divide-y">
                  {players.map((player) => {
                    const fullName = [player.first_name, player.last_name]
                      .filter(Boolean)
                      .join(" ");

                    return (
                      <div
                        key={player.id}
                        className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6"
                      >
                        <div className="min-w-0">
                          <p className="font-medium break-words">
                            {fullName || "Unbekannter Spieler"}
                          </p>
                        </div>

                        {player.jersey_number !== null && (
                          <span className="shrink-0 text-sm text-muted-foreground">
                            #{player.jersey_number}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </main>
  );
}

export default TeamDetailPage;

import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useTeams } from "@/hooks/teams/useTeams";

import type { Tables } from "@/lib/supabase";
import { supabase } from "@/lib/supabase";

type Team = Tables<"teams">;
type Club = Tables<"clubs">;
type League = Tables<"leagues">;

type TeamWithRelations = {
  team: Team;
  club: Club | null;
  league: League | null;
};

function TeamsPage() {
  const { teams, isLoading: isTeamsLoading, error: teamsError } = useTeams();

  const [teamRelations, setTeamRelations] = useState<TeamWithRelations[]>([]);
  const [isLoadingRelations, setIsLoadingRelations] = useState(false);
  const [relationsError, setRelationsError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (teams.length === 0) {
      setTeamRelations([]);
      return;
    }

    let isMounted = true;

    async function fetchRelations() {
      setIsLoadingRelations(true);
      setRelationsError(null);

      const clubIds = [...new Set(teams.map((team) => team.club_id))];

      const leagueIds = [
        ...new Set(
          teams
            .map((team) => team.league_id)
            .filter((id): id is string => id !== null)
        ),
      ];

      const [clubsResult, leaguesResult] = await Promise.all([
        supabase.from("clubs").select("*").in("id", clubIds),
        leagueIds.length > 0
          ? supabase.from("leagues").select("*").in("id", leagueIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (!isMounted) {
        return;
      }

      if (clubsResult.error || leaguesResult.error) {
        console.error(
          "Fehler beim Laden der Team-Beziehungen:",
          clubsResult.error ?? leaguesResult.error
        );

        setRelationsError(
          "Verein- oder Ligadaten konnten nicht geladen werden."
        );
        setTeamRelations([]);
        setIsLoadingRelations(false);
        return;
      }

      const clubs = clubsResult.data ?? [];
      const leagues = leaguesResult.data ?? [];

      const relations = teams.map((team) => ({
        team,
        club: clubs.find((club) => club.id === team.club_id) ?? null,
        league: leagues.find((league) => league.id === team.league_id) ?? null,
      }));

      setTeamRelations(relations);
      setIsLoadingRelations(false);
    }

    void fetchRelations();

    return () => {
      isMounted = false;
    };
  }, [teams]);

  const filteredTeamRelations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return teamRelations;
    }

    return teamRelations.filter(({ team, club, league }) => {
      return (
        team.name.toLowerCase().includes(query) ||
        team.age_group.toLowerCase().includes(query) ||
        club?.name.toLowerCase().includes(query) ||
        league?.name.toLowerCase().includes(query)
      );
    });
  }, [teamRelations, searchQuery]);

  const isLoading = isTeamsLoading || isLoadingRelations;
  const error = teamsError ?? relationsError;

  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-6">
        <header className="mb-6">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="mt-2 h-5 w-72 max-w-full" />
        </header>

        <div className="mb-6">
          <Skeleton className="h-10 w-full" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="space-y-3 p-5">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="container mx-auto px-4 py-6">
        <Card>
          <CardContent className="p-6">
            <h1 className="text-lg font-semibold">
              Mannschaften konnten nicht geladen werden
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Teams</h1>

        <p className="mt-2 text-muted-foreground">
          Entdecke Mannschaften, Vereine und Ligen.
        </p>
      </header>

      {teamRelations.length > 0 && (
        <div className="relative mb-6">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            type="search"
            placeholder="Team suchen ..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="pl-9"
            aria-label="Team suchen"
          />
        </div>
      )}

      {teamRelations.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <h2 className="font-semibold">Keine Mannschaften vorhanden</h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Aktuell wurden noch keine Mannschaften angelegt.
            </p>
          </CardContent>
        </Card>
      ) : filteredTeamRelations.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="font-semibold">Keine Teams gefunden</h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Für „{searchQuery}“ wurden keine passenden Teams gefunden.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTeamRelations.map(({ team, club, league }) => (
            <Link
              key={team.id}
              to={`/clubs/${team.club_id}/teams/${team.id}`}
              className="block h-full min-w-0"
            >
              <Card className="h-full transition-colors hover:bg-muted/50">
                <CardContent className="p-5">
                  <h2 className="text-lg font-semibold break-words">
                    {team.name}
                  </h2>

                  {team.age_group && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {team.age_group}
                    </p>
                  )}

                  {club && (
                    <p className="mt-3 text-sm font-medium">{club.name}</p>
                  )}

                  {league && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {league.name}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

export default TeamsPage;

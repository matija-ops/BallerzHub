import { useEffect, useState } from "react";

import type { Tables } from "@/types/supabase.types";
import { supabase } from "@/lib/supabase";

type Standing = Tables<"standings">;
type Team = Tables<"teams">;

export type LeagueStanding = Standing & {
  team: Team | null;
};

type UseLeagueStandingsResult = {
  standings: LeagueStanding[];
  isLoading: boolean;
  error: string | null;
};

export function useLeagueStandings(
  leagueId: string | undefined
): UseLeagueStandingsResult {
  const [standings, setStandings] = useState<LeagueStanding[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!leagueId) {
      setStandings([]);
      setError("Keine Liga angegeben.");
      setIsLoading(false);
      return;
    }

    const currentLeagueId = leagueId;
    let isMounted = true;

    async function fetchStandings() {
      setIsLoading(true);
      setError(null);

      const { data, error: standingsError } = await supabase
        .from("standings")
        .select("*")
        .eq("league_id", currentLeagueId)
        .order("position", { ascending: true });

      if (!isMounted) return;

      if (standingsError) {
        console.error("Fehler beim Laden der Tabelle:", standingsError);

        setStandings([]);
        setError("Die Tabelle konnte nicht geladen werden.");
        setIsLoading(false);
        return;
      }

      const rows = data ?? [];

      const teamIds = [
        ...new Set(
          rows
            .map((standing) => standing.team_id)
            .filter((teamId): teamId is string => Boolean(teamId))
        ),
      ];

      if (teamIds.length === 0) {
        setStandings(
          rows.map((standing) => ({
            ...standing,
            team: null,
          }))
        );

        setIsLoading(false);
        return;
      }

      const { data: teams, error: teamsError } = await supabase
        .from("teams")
        .select("*")
        .in("id", teamIds);

      if (!isMounted) return;

      if (teamsError) {
        console.error(
          "Fehler beim Laden der Mannschaften der Tabelle:",
          teamsError
        );

        setStandings([]);
        setError("Die Mannschaften der Tabelle konnten nicht geladen werden.");
        setIsLoading(false);
        return;
      }

      const teamsById = new Map((teams ?? []).map((team) => [team.id, team]));

      const standingsWithTeams: LeagueStanding[] = rows.map((standing) => ({
        ...standing,
        team: standing.team_id
          ? (teamsById.get(standing.team_id) ?? null)
          : null,
      }));

      setStandings(standingsWithTeams);
      setIsLoading(false);
    }

    void fetchStandings();

    return () => {
      isMounted = false;
    };
  }, [leagueId]);

  return {
    standings,
    isLoading,
    error,
  };
}

import { useEffect, useState } from "react";
import type { Tables } from "@/types/supabase.types";
import { supabase } from "@/lib/supabase";

type League = Tables<"leagues">;
type Team = Tables<"teams">;

type UseLeagueDetailResult = {
  league: League | null;
  teams: Team[];
  isLoading: boolean;
  error: string | null;
};

export function useLeagueDetail(
  leagueId: string | undefined
): UseLeagueDetailResult {
  const [league, setLeague] = useState<League | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!leagueId) {
      setLeague(null);
      setTeams([]);
      setError("Keine Liga angegeben.");
      setIsLoading(false);
      return;
    }

    const currentLeagueId = leagueId;
    let isMounted = true;

    async function fetchLeagueDetail() {
      setIsLoading(true);
      setError(null);

      const [leagueResult, teamsResult] = await Promise.all([
        supabase.from("leagues").select("*").eq("id", currentLeagueId).single(),

        supabase
          .from("teams")
          .select("*")
          .eq("league_id", currentLeagueId)
          .order("name", { ascending: true }),
      ]);

      if (!isMounted) return;

      if (leagueResult.error) {
        setLeague(null);
        setTeams([]);
        setError("Die Liga konnte nicht geladen werden.");
        setIsLoading(false);
        return;
      }

      if (teamsResult.error) {
        setLeague(leagueResult.data);
        setTeams([]);
        setError("Die Mannschaften der Liga konnten nicht geladen werden.");
        setIsLoading(false);
        return;
      }

      setLeague(leagueResult.data);
      setTeams(teamsResult.data ?? []);
      setIsLoading(false);
    }

    void fetchLeagueDetail();

    return () => {
      isMounted = false;
    };
  }, [leagueId]);

  return {
    league,
    teams,
    isLoading,
    error,
  };
}

import { useEffect, useState } from "react";

import type { Tables } from "@/types/supabase.types";
import { supabase } from "@/lib/supabase";

type Game = Tables<"games">;
type Team = Tables<"teams">;

export type LeagueGame = Game & {
  home_team: Team;
  away_team: Team;
};

type UseLeagueGamesResult = {
  upcomingGames: LeagueGame[];
  pastGames: LeagueGame[];
  isLoading: boolean;
  error: string | null;
};

export function useLeagueGames(
  leagueId: string | undefined
): UseLeagueGamesResult {
  const [upcomingGames, setUpcomingGames] = useState<LeagueGame[]>([]);
  const [pastGames, setPastGames] = useState<LeagueGame[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!leagueId) {
      setUpcomingGames([]);
      setPastGames([]);
      setError("Keine Liga angegeben.");
      setIsLoading(false);
      return;
    }

    const currentLeagueId = leagueId;
    let isMounted = true;

    async function fetchGames() {
      setIsLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from("games")
        .select("*")
        .eq("league_id", currentLeagueId)
        .order("game_date", { ascending: true });

      if (!isMounted) return;

      if (supabaseError) {
        console.error("Fehler beim Laden der Spiele:", supabaseError);
        setUpcomingGames([]);
        setPastGames([]);
        setError("Die Spiele konnten nicht geladen werden.");
        setIsLoading(false);
        return;
      }

      const games = data ?? [];

      const teamIds = [
        ...new Set(
          games.flatMap((game) => [game.home_team_id, game.away_team_id])
        ),
      ];

      if (teamIds.length === 0) {
        setUpcomingGames([]);
        setPastGames([]);
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
          "Fehler beim Laden der Mannschaften der Spiele:",
          teamsError
        );
        setUpcomingGames([]);
        setPastGames([]);
        setError("Die Mannschaften der Spiele konnten nicht geladen werden.");
        setIsLoading(false);
        return;
      }

      const teamsById = new Map((teams ?? []).map((team) => [team.id, team]));

      const gamesWithTeams: LeagueGame[] = games.flatMap((game) => {
        const homeTeam = teamsById.get(game.home_team_id);
        const awayTeam = teamsById.get(game.away_team_id);

        if (!homeTeam || !awayTeam) {
          return [];
        }

        return [
          {
            ...game,
            home_team: homeTeam,
            away_team: awayTeam,
          },
        ];
      });

      const today = new Date().toISOString().slice(0, 10);

      setUpcomingGames(
        gamesWithTeams.filter((game) => game.game_date >= today)
      );

      setPastGames(
        gamesWithTeams.filter((game) => game.game_date < today).reverse()
      );

      setIsLoading(false);
    }

    void fetchGames();

    return () => {
      isMounted = false;
    };
  }, [leagueId]);

  return {
    upcomingGames,
    pastGames,
    isLoading,
    error,
  };
}

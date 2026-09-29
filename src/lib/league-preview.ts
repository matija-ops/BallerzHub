import type { Tables } from "@/types/supabase.types";
import type { LeagueGame } from "@/hooks/games/useLeagueGames";
import type { LeagueStanding } from "@/hooks/standings/useLeagueStandings";

export function createLeaguePreview(
  teams: Tables<"teams">[],
  leagueId: string
) {
  const past: LeagueGame[] = [];
  const upcoming: LeagueGame[] = [];
  const date = (offset: number) => {
    const day = new Date();
    day.setDate(day.getDate() + offset);
    return `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
  };
  if (teams.length > 1) {
    for (let index = 0; index < teams.length; index++) {
      const home = teams[index];
      const away = teams[(index + 1) % teams.length];
      const base = {
        league_id: leagueId,
        home_team_id: home.id,
        away_team_id: away.id,
        home_team: home,
        away_team: away,
        created_at: null,
        updated_at: null,
      };
      past.push({
        ...base,
        id: `demo-past-${index}`,
        game_date: date(-1 - Math.floor(index / 3)),
        game_time: "18:00:00",
        home_score: 72 + (index % 9),
        away_score: (index % 3 === 0 ? 84 : 65) + (index % 7),
      });
      upcoming.push({
        ...base,
        id: `demo-next-${index}`,
        game_date: date(3 + Math.floor(index / 3)),
        game_time: `${16 + (index % 4)}:30:00`,
        home_score: 0,
        away_score: 0,
      });
    }
  }
  const standings: LeagueStanding[] = teams
    .map((team) => {
      const played = past.filter(
        (game) => game.home_team_id === team.id || game.away_team_id === team.id
      );
      const wins = played.filter((game) =>
        game.home_team_id === team.id
          ? game.home_score > game.away_score
          : game.away_score > game.home_score
      ).length;
      return {
        id: `demo-standing-${team.id}`,
        league_id: leagueId,
        team_id: team.id,
        team,
        position: 0,
        games_played: played.length,
        wins,
        losses: played.length - wins,
        points: wins * 2,
        created_at: null,
        updated_at: null,
      };
    })
    .sort(
      (a, b) =>
        b.points - a.points || a.team!.name.localeCompare(b.team!.name, "de")
    );
  standings.forEach((row, index) => {
    row.position = index + 1;
  });
  return { past, upcoming, standings };
}

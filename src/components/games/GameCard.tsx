import { Link } from "react-router-dom";

import { Card, CardContent } from "@/components/ui/card";
import type { LeagueGame } from "@/hooks/games/useLeagueGames";

type GameCardProps = {
  game: LeagueGame;
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
  }).format(new Date(`${date}T00:00:00`));
}

function formatTime(time: string | null) {
  if (!time) return "Uhrzeit offen";

  return time.slice(0, 5);
}

function GameCard({ game }: GameCardProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="mb-4 flex items-center justify-between gap-4 text-sm text-muted-foreground">
          <span>{formatDate(game.game_date)}</span>
          <span>{formatTime(game.game_time)}</span>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <Link
            to={`/clubs/${game.home_team.club_id}/teams/${game.home_team.id}`}
            className="font-medium hover:underline"
          >
            {game.home_team.name}
          </Link>

          <div className="text-center text-sm font-semibold text-muted-foreground">
            {game.home_score} : {game.away_score}
          </div>

          <Link
            to={`/clubs/${game.away_team.club_id}/teams/${game.away_team.id}`}
            className="text-right font-medium hover:underline"
          >
            {game.away_team.name}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default GameCard;

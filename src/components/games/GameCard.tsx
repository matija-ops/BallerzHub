import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { LeagueGame } from "@/hooks/games/useLeagueGames";

type GameCardProps = {
  game: LeagueGame;
  upcoming?: boolean;
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
  }).format(new Date(`${date}T00:00:00`));
}

function formatTime(time: string | null) {
  if (!time) return "Uhrzeit offen";

  return `${time.slice(0, 5)} Uhr`;
}

function GameCard({ game, upcoming = false }: GameCardProps) {
  const navigate = useNavigate();
  return (
    <Card>
      <CardContent className="p-5">
        <div className="mb-4 flex items-center justify-between gap-4 text-sm text-muted-foreground">
          <span>{formatDate(game.game_date)}</span>
          <span>{formatTime(game.game_time)}</span>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() =>
              navigate(
                `/clubs/${game.home_team.club_id}/teams/${game.home_team.id}`
              )
            }
            className="h-auto justify-start text-left whitespace-normal text-primary hover:bg-primary/10"
          >
            {game.home_team.name}
          </Button>

          <div className="text-center text-sm font-semibold text-muted-foreground">
            {upcoming ? "vs." : `${game.home_score} : ${game.away_score}`}
          </div>

          <Button
            type="button"
            variant="ghost"
            onClick={() =>
              navigate(
                `/clubs/${game.away_team.club_id}/teams/${game.away_team.id}`
              )
            }
            className="h-auto justify-end text-right whitespace-normal text-primary hover:bg-primary/10"
          >
            {game.away_team.name}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default GameCard;

import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { LeagueGame } from "@/hooks/games/useLeagueGames";

type GameCardProps = {
  game: LeagueGame;
  upcoming?: boolean;
};

type GameTeam = LeagueGame["home_team"];

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

  function renderTeam(team: GameTeam, alignment: "left" | "right") {
    const alignmentClasses =
      alignment === "left"
        ? "justify-start text-left"
        : "justify-end text-right";

    if (team.website_url) {
      return (
        <Button
          type="button"
          variant="ghost"
          asChild
          className={`h-auto whitespace-normal text-primary hover:bg-primary/10 ${alignmentClasses}`}
        >
          <a href={team.website_url} target="_blank" rel="noopener noreferrer">
            {team.name}
          </a>
        </Button>
      );
    }

    return (
      <Button
        type="button"
        variant="ghost"
        onClick={() => navigate(`/clubs/${team.club_id}/teams/${team.id}`)}
        className={`h-auto whitespace-normal text-primary hover:bg-primary/10 ${alignmentClasses}`}
      >
        {team.name}
      </Button>
    );
  }

  return (
    <Card>
      <CardContent className="p-5">
        <div className="mb-4 flex items-center justify-between gap-4 text-sm text-muted-foreground">
          <span>{formatDate(game.game_date)}</span>
          <span>{formatTime(game.game_time)}</span>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          {renderTeam(game.home_team, "left")}

          <div className="text-center text-sm font-semibold text-muted-foreground">
            {upcoming
              ? "vs."
              : `${game.home_score ?? "–"} : ${game.away_score ?? "–"}`}
          </div>

          {renderTeam(game.away_team, "right")}
        </div>
      </CardContent>
    </Card>
  );
}

export default GameCard;

import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, Clock3, Trophy } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { supabase } from "@/lib/supabase";
import type { Tables } from "@/types/supabase.types";

type Game = Tables<"games">;
type Team = Tables<"teams">;
type League = Tables<"leagues">;

function GameDetailPage() {
  const navigate = useNavigate();
  const { gameId } = useParams<{ gameId: string }>();

  const [game, setGame] = useState<Game | null>(null);
  const [homeTeam, setHomeTeam] = useState<Team | null>(null);
  const [awayTeam, setAwayTeam] = useState<Team | null>(null);
  const [league, setLeague] = useState<League | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadGame = async () => {
      if (!gameId) {
        setError("Kein Spiel angegeben.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      const { data: gameData, error: gameError } = await supabase
        .from("games")
        .select("*")
        .eq("id", gameId)
        .maybeSingle();

      if (gameError || !gameData) {
        setError("Das Spiel konnte nicht geladen werden.");
        setIsLoading(false);
        return;
      }

      const [homeTeamResult, awayTeamResult, leagueResult] = await Promise.all([
        supabase
          .from("teams")
          .select("*")
          .eq("id", gameData.home_team_id)
          .maybeSingle(),

        supabase
          .from("teams")
          .select("*")
          .eq("id", gameData.away_team_id)
          .maybeSingle(),

        supabase
          .from("leagues")
          .select("*")
          .eq("id", gameData.league_id)
          .maybeSingle(),
      ]);

      if (homeTeamResult.error || awayTeamResult.error) {
        setError("Die Mannschaftsdaten konnten nicht geladen werden.");
        setIsLoading(false);
        return;
      }

      setGame(gameData);
      setHomeTeam(homeTeamResult.data);
      setAwayTeam(awayTeamResult.data);
      setLeague(leagueResult.data ?? null);
      setIsLoading(false);
    };

    void loadGame();
  }, [gameId]);

  if (isLoading) {
    return (
      <main className="container mx-auto max-w-3xl px-4 py-6">
        <Skeleton className="mb-4 h-9 w-32" />

        <Card>
          <CardHeader className="space-y-3">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>

          <CardContent className="space-y-8">
            <Skeleton className="mx-auto h-12 w-48" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </main>
    );
  }

  if (error || !game) {
    return (
      <main className="container mx-auto max-w-3xl px-4 py-6">
        <Button
          type="button"
          variant="ghost"
          className="mb-4 -ml-2"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="size-5 shrink-0" />
          Zurück
        </Button>

        <Card>
          <CardContent className="p-6">
            <h1 className="text-lg font-semibold">
              Spiel konnte nicht geladen werden
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              {error ?? "Unbekannter Fehler."}
            </p>
          </CardContent>
        </Card>
      </main>
    );
  }

  const isFinished = new Date(`${game.game_date}T23:59:59`) < new Date();

  const homeWon = (game.home_score ?? 0) > (game.away_score ?? 0);
  const awayWon = (game.away_score ?? 0) > (game.home_score ?? 0);

  return (
    <main className="container mx-auto max-w-3xl px-4 py-6">
      <Button
        type="button"
        variant="ghost"
        className="mb-4 -ml-2"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="size-5 shrink-0" />
        Zurück
      </Button>

      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10">
            <Trophy className="size-6 text-primary" />
          </div>

          <CardTitle>Spiel</CardTitle>

          <CardDescription>
            {league?.name ?? "Liga"}
            {league?.season ? ` · ${league.season}` : ""}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-8">
          <div className="flex flex-wrap justify-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="size-4" />
              {formatDate(game.game_date)}
            </span>

            {game.game_time && (
              <span className="flex items-center gap-1.5">
                <Clock3 className="size-4" />
                {formatTime(game.game_time)} Uhr
              </span>
            )}

            <Badge variant={isFinished ? "secondary" : "default"}>
              {isFinished ? "Beendet" : "Kommend"}
            </Badge>
          </div>

          <div className="grid gap-6 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
            <div className="text-center">
              <p className={`text-lg ${homeWon ? "font-bold" : "font-medium"}`}>
                {homeTeam?.name ?? "Heimmannschaft"}
              </p>

              <p className="mt-1 text-sm text-muted-foreground">Heim</p>
            </div>

            <div className="text-center">
              <div className="text-4xl font-bold tracking-tight">
                {game.home_score}
                <span className="mx-2 text-muted-foreground">:</span>
                {game.away_score}
              </div>
            </div>

            <div className="text-center">
              <p className={`text-lg ${awayWon ? "font-bold" : "font-medium"}`}>
                {awayTeam?.name ?? "Auswärtsmannschaft"}
              </p>

              <p className="mt-1 text-sm text-muted-foreground">Auswärts</p>
            </div>
          </div>

          <div className="flex justify-center">
            <Button asChild variant="outline">
              <Link to={`/leagues/${game.league_id}`}>Zur Liga</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

function formatTime(time: string) {
  return time.slice(0, 5);
}

export default GameDetailPage;

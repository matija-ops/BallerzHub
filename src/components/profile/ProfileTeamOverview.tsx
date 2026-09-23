import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Clock3, Trophy } from "lucide-react";

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { supabase } from "@/lib/supabase";
import type { Tables } from "@/types/supabase.types";

type Team = Tables<"teams">;
type League = Tables<"leagues">;
type Game = Tables<"games">;
type Standing = Tables<"standings">;

type TeamOverviewData = {
  team: Team;
  league: League | null;
  nextGame: Game | null;
  previousGame: Game | null;
  teams: Team[];
  standings: Standing[];
};

interface ProfileTeamOverviewProps {
  teamId: string;
}

function formatGameDate(date: string) {
  return new Intl.DateTimeFormat("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

function formatGameTime(time: string | null) {
  if (!time) {
    return null;
  }

  return time.slice(0, 5);
}

function getTeamName(teams: Team[], teamId: string) {
  return teams.find((team) => team.id === teamId)?.name ?? "Unbekannt";
}

function getGameResult(game: Game, teamId: string) {
  const isHomeTeam = game.home_team_id === teamId;

  const ownScore = isHomeTeam ? game.home_score : game.away_score;
  const opponentScore = isHomeTeam ? game.away_score : game.home_score;

  if (ownScore > opponentScore) {
    return {
      label: "Sieg",
      variant: "default" as const,
    };
  }

  if (ownScore < opponentScore) {
    return {
      label: "Niederlage",
      variant: "destructive" as const,
    };
  }

  return {
    label: "Unentschieden",
    variant: "secondary" as const,
  };
}

function GameMatchup({
  game,
  teamId,
  teams,
}: {
  game: Game;
  teamId: string;
  teams: Team[];
}) {
  const homeTeamName = getTeamName(teams, game.home_team_id);
  const awayTeamName = getTeamName(teams, game.away_team_id);

  const isHomeTeam = game.home_team_id === teamId;

  return (
    <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
      <div
        className={
          isHomeTeam
            ? "font-semibold sm:text-right"
            : "text-muted-foreground sm:text-right"
        }
      >
        {homeTeamName}
      </div>

      <div className="flex items-center justify-center gap-3 text-xl font-bold">
        <span>{game.home_score}</span>

        <span className="text-muted-foreground">:</span>

        <span>{game.away_score}</span>
      </div>

      <div className={!isHomeTeam ? "font-semibold" : "text-muted-foreground"}>
        {awayTeamName}
      </div>
    </div>
  );
}

function ProfileTeamOverview({ teamId }: ProfileTeamOverviewProps) {
  const [data, setData] = useState<TeamOverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadTeamOverview = async () => {
      setIsLoading(true);
      setError(null);

      const { data: team, error: teamError } = await supabase
        .from("teams")
        .select("*")
        .eq("id", teamId)
        .maybeSingle();

      if (teamError || !team) {
        if (isMounted) {
          setError("Deine Mannschaft konnte nicht geladen werden.");
          setIsLoading(false);
        }

        return;
      }

      const today = new Date().toISOString().split("T")[0];

      const [
        leagueResult,
        nextGameResult,
        previousGameResult,
        standingsResult,
      ] = await Promise.all([
        supabase
          .from("leagues")
          .select("*")
          .eq("id", team.league_id)
          .maybeSingle(),

        supabase
          .from("games")
          .select("*")
          .eq("league_id", team.league_id)
          .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
          .gte("game_date", today)
          .order("game_date", { ascending: true })
          .order("game_time", { ascending: true })
          .limit(1),

        supabase
          .from("games")
          .select("*")
          .eq("league_id", team.league_id)
          .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
          .lt("game_date", today)
          .order("game_date", { ascending: false })
          .order("game_time", { ascending: false })
          .limit(1),

        supabase
          .from("standings")
          .select("*")
          .eq("league_id", team.league_id)
          .order("position", { ascending: true }),
      ]);

      if (
        leagueResult.error ||
        nextGameResult.error ||
        previousGameResult.error ||
        standingsResult.error
      ) {
        if (isMounted) {
          setError(
            "Die Mannschaftsdaten konnten nicht vollständig geladen werden."
          );
          setIsLoading(false);
        }

        return;
      }

      const nextGame = nextGameResult.data?.[0] ?? null;
      const previousGame = previousGameResult.data?.[0] ?? null;
      const standings = standingsResult.data ?? [];

      const teamIds = Array.from(
        new Set([
          ...standings
            .map((standing) => standing.team_id)
            .filter((id): id is string => Boolean(id)),

          ...(nextGame ? [nextGame.home_team_id, nextGame.away_team_id] : []),

          ...(previousGame
            ? [previousGame.home_team_id, previousGame.away_team_id]
            : []),
        ])
      );

      let gameTeams: Team[] = [];

      if (teamIds.length > 0) {
        const { data: teamsData, error: teamsError } = await supabase
          .from("teams")
          .select("*")
          .in("id", teamIds);

        if (teamsError) {
          if (isMounted) {
            setError("Die Mannschaftsdaten konnten nicht geladen werden.");
            setIsLoading(false);
          }

          return;
        }

        gameTeams = teamsData ?? [];
      }

      if (!isMounted) {
        return;
      }

      setData({
        team,
        league: leagueResult.data ?? null,
        nextGame,
        previousGame,
        teams: gameTeams,
        standings,
      });

      setIsLoading(false);
    };

    void loadTeamOverview();

    return () => {
      isMounted = false;
    };
  }, [teamId]);

  const ownStanding = useMemo(
    () =>
      data?.standings.find((standing) => standing.team_id === data.team.id) ??
      null,
    [data]
  );

  if (isLoading) {
    return (
      <section className="space-y-4">
        <Skeleton className="h-8 w-48" />

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-4 w-40" />
          </CardHeader>

          <CardContent className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>

          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </section>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">
            {error ?? "Die Mannschaftsdaten konnten nicht geladen werden."}
          </p>
        </CardContent>
      </Card>
    );
  }

  const { team, league, nextGame, previousGame, teams, standings } = data;

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Meine Mannschaft</h2>

        <p className="text-sm text-muted-foreground">
          {team.name}
          {league?.name ? ` · ${league.name}` : ""}
        </p>
      </div>

      {/* Nächstes Spiel */}
      <Card className="overflow-hidden border-primary/30">
        <div className="bg-primary px-6 py-3 text-primary-foreground">
          <div className="flex items-center gap-2 font-semibold">
            <CalendarDays className="size-4" />
            Nächstes Spiel
          </div>
        </div>

        <CardHeader>
          {league && (
            <CardDescription>
              {league.name}
              {league.season ? ` · ${league.season}` : ""}
            </CardDescription>
          )}

          <CardTitle>
            {nextGame
              ? formatGameDate(nextGame.game_date)
              : "Kein kommendes Spiel"}
          </CardTitle>
        </CardHeader>

        <CardContent>
          {nextGame ? (
            <Link
              to={`/leagues/${nextGame.league_id}/games/${nextGame.id}`}
              className="block rounded-lg transition-colors hover:bg-muted/50"
            >
              <div className="space-y-5 p-2">
                <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                  <div className="text-center sm:text-right">
                    <p
                      className={
                        nextGame.home_team_id === team.id
                          ? "font-semibold"
                          : "text-muted-foreground"
                      }
                    >
                      {getTeamName(teams, nextGame.home_team_id)}
                    </p>

                    <p className="text-xs text-muted-foreground">Heim</p>
                  </div>

                  <div className="text-center">
                    <div className="text-sm font-medium text-muted-foreground">
                      vs.
                    </div>
                  </div>

                  <div className="text-center sm:text-left">
                    <p
                      className={
                        nextGame.away_team_id === team.id
                          ? "font-semibold"
                          : "text-muted-foreground"
                      }
                    >
                      {getTeamName(teams, nextGame.away_team_id)}
                    </p>

                    <p className="text-xs text-muted-foreground">Auswärts</p>
                  </div>
                </div>

                <div className="flex flex-wrap justify-center gap-3 text-sm text-muted-foreground">
                  {nextGame.game_time && (
                    <span className="flex items-center gap-1.5">
                      <Clock3 className="size-4" />
                      {formatGameTime(nextGame.game_time)} Uhr
                    </span>
                  )}

                  <Badge variant="secondary">
                    {nextGame.home_team_id === team.id
                      ? "Heimspiel"
                      : "Auswärtsspiel"}
                  </Badge>
                </div>

                <p className="text-center text-xs text-muted-foreground">
                  Spiel ansehen →
                </p>
              </div>
            </Link>
          ) : (
            <p className="text-sm text-muted-foreground">
              Für deine Mannschaft ist aktuell kein kommendes Spiel eingetragen.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Letztes Spiel */}
      {previousGame && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Letztes Spiel</CardTitle>

            <CardDescription>
              {formatGameDate(previousGame.game_date)}

              {previousGame.game_time
                ? ` · ${formatGameTime(previousGame.game_time)} Uhr`
                : ""}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Link
              to={`/leagues/${previousGame.league_id}/games/${previousGame.id}`}
              className="block rounded-lg p-2 transition-colors hover:bg-muted/50"
            >
              <div className="space-y-4">
                <GameMatchup
                  game={previousGame}
                  teamId={team.id}
                  teams={teams}
                />

                <div className="flex justify-center">
                  <Badge variant={getGameResult(previousGame, team.id).variant}>
                    {getGameResult(previousGame, team.id).label}
                  </Badge>
                </div>

                <p className="text-center text-xs text-muted-foreground">
                  Spiel ansehen →
                </p>
              </div>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Tabelle */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="size-5" />
                Tabelle
              </CardTitle>

              <CardDescription>
                {league?.name ?? "Aktuelle Liga"}
              </CardDescription>
            </div>

            {ownStanding && (
              <Badge variant="secondary">Platz {ownStanding.position}</Badge>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {standings.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>

                    <TableHead>Mannschaft</TableHead>

                    <TableHead className="text-center">Sp</TableHead>

                    <TableHead className="text-center">S</TableHead>

                    <TableHead className="text-center">N</TableHead>

                    <TableHead className="text-right">Pkt</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {standings.map((standing) => {
                    const standingTeam = standing.team_id
                      ? teams.find((item) => item.id === standing.team_id)
                      : null;

                    const isOwnTeam = standing.team_id === team.id;

                    return (
                      <TableRow
                        key={standing.id}
                        className={isOwnTeam ? "bg-primary/5 font-medium" : ""}
                      >
                        <TableCell>{standing.position}</TableCell>

                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>
                              {standingTeam?.name ?? "Unbekannte Mannschaft"}
                            </span>

                            {isOwnTeam && (
                              <Badge variant="outline" className="text-xs">
                                Meine Mannschaft
                              </Badge>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="text-center">
                          {standing.games_played}
                        </TableCell>

                        <TableCell className="text-center">
                          {standing.wins}
                        </TableCell>

                        <TableCell className="text-center">
                          {standing.losses}
                        </TableCell>

                        <TableCell className="text-right font-semibold">
                          {standing.points}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Für diese Liga ist aktuell keine Tabelle hinterlegt.
            </p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

export default ProfileTeamOverview;

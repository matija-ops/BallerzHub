import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import GameCard from "@/components/games/GameCard";
import StandingsTable from "@/components/standings/StandingsTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLeagueGames, type LeagueGame } from "@/hooks/games/useLeagueGames";
import { useLeagueDetail } from "@/hooks/leagues/useLeagueDetail";
import { useLeagueStandings } from "@/hooks/standings/useLeagueStandings";

function LeagueDetailPage() {
  const { leagueId } = useParams<{ leagueId: string }>();
  const navigate = useNavigate();
  const [selectedPastMatchday, setSelectedPastMatchday] = useState<
    string | null
  >(null);
  const {
    league,
    teams,
    isLoading: leagueLoading,
    error: leagueError,
  } = useLeagueDetail(leagueId);
  const {
    upcomingGames,
    pastGames,
    isLoading: gamesLoading,
    error: gamesError,
  } = useLeagueGames(leagueId);
  const {
    standings,
    isLoading: standingsLoading,
    error: standingsError,
  } = useLeagueStandings(leagueId);
  const backButton = (
    <Button
      type="button"
      variant="ghost"
      className="text-primary hover:bg-primary/10"
      onClick={() => navigate("/courts")}
    >
      <ArrowLeft /> Zurück
    </Button>
  );

  if (leagueLoading)
    return (
      <main className="container mx-auto space-y-6 px-4 py-6">
        {backButton}
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-64 w-full" />
      </main>
    );
  if (leagueError || !league)
    return (
      <main className="container mx-auto px-4 py-6">
        {backButton}
        <p role="alert">{leagueError ?? "Liga nicht gefunden."}</p>
      </main>
    );

  function getCurrentMatchdayGames(
    games: LeagueGame[],
    upcoming: boolean
  ): LeagueGame[] {
    if (!games.length) return [];

    const matchdays = games
      .map((game) => game.external_match_day)
      .filter((matchday): matchday is number => matchday !== null);

    if (matchdays.length > 0) {
      const selectedMatchday = upcoming
        ? Math.min(...matchdays)
        : Math.max(...matchdays);

      return games.filter(
        (game) => game.external_match_day === selectedMatchday
      );
    }

    const dates = games.map((game) => game.game_date);
    const selectedDate = upcoming
      ? dates.reduce((earliest, date) => (date < earliest ? date : earliest))
      : dates.reduce((latest, date) => (date > latest ? date : latest));

    return games.filter((game) => game.game_date === selectedDate);
  }

  const displayedUpcoming = getCurrentMatchdayGames(upcomingGames, true);
  const allLeagueGames = [...pastGames, ...upcomingGames];
  const pastMatchdays = Array.from(
    new Set(
      pastGames.map((game) =>
        game.external_match_day !== null
          ? `matchday-${game.external_match_day}`
          : `date-${game.game_date}`
      )
    )
  ).sort((a, b) => {
    const aValue = a.startsWith("matchday-")
      ? Number(a.replace("matchday-", ""))
      : a;
    const bValue = b.startsWith("matchday-")
      ? Number(b.replace("matchday-", ""))
      : b;
    return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
  });
  const activePastMatchday =
    selectedPastMatchday && pastMatchdays.includes(selectedPastMatchday)
      ? selectedPastMatchday
      : (pastMatchdays.at(-1) ?? null);
  const selectedPastGames = activePastMatchday
    ? allLeagueGames
        .filter((game) =>
          activePastMatchday.startsWith("matchday-")
            ? `matchday-${game.external_match_day}` === activePastMatchday
            : `date-${game.game_date}` === activePastMatchday
        )
        .sort((a, b) =>
          `${a.game_date} ${a.game_time ?? ""}`.localeCompare(
            `${b.game_date} ${b.game_time ?? ""}`
          )
        )
    : [];
  const getMatchdayKey = (game: LeagueGame) =>
    game.external_match_day !== null
      ? `matchday-${game.external_match_day}`
      : `date-${game.game_date}`;
  const today = new Date().toISOString().slice(0, 10);
  const nextMatchday = Array.from(new Set(upcomingGames.map(getMatchdayKey)))
    .map((key) => ({
      key,
      games: allLeagueGames.filter((game) => getMatchdayKey(game) === key),
    }))
    .filter(
      ({ games }) =>
        games.length > 0 && games.every((game) => game.game_date >= today)
    )
    .sort((a, b) =>
      a.games
        .map((game) => game.game_date)
        .sort()[0]
        .localeCompare(b.games.map((game) => game.game_date).sort()[0])
    )[0]?.key;
  const selectedUpcomingGames = nextMatchday
    ? allLeagueGames
        .filter((game) => getMatchdayKey(game) === nextMatchday)
        .sort((a, b) =>
          `${a.game_date} ${a.game_time ?? ""}`.localeCompare(
            `${b.game_date} ${b.game_time ?? ""}`
          )
        )
    : displayedUpcoming;
  const activePastIndex = activePastMatchday
    ? pastMatchdays.indexOf(activePastMatchday)
    : -1;
  const activePastDates = allLeagueGames
    .filter((game) =>
      activePastMatchday?.startsWith("matchday-")
        ? `matchday-${game.external_match_day}` === activePastMatchday
        : `date-${game.game_date}` === activePastMatchday
    )
    .map((game) => game.game_date)
    .sort();
  const formatMatchdayDateRange = () => {
    if (!activePastDates.length) return "";
    const formatDate = (date: string) =>
      new Intl.DateTimeFormat("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(new Date(`${date}T00:00:00`));
    const firstDate = formatDate(activePastDates[0]);
    const lastDate = formatDate(activePastDates.at(-1) ?? activePastDates[0]);
    return firstDate === lastDate ? firstDate : `${firstDate} – ${lastDate}`;
  };
  const tableRows = [
    ...standings,
    ...teams
      .filter((team) => !standings.some((row) => row.team_id === team.id))
      .map((team, index) => ({
        id: `unranked-${team.id}`,
        league_id: league.id,
        team_id: team.id,
        team,
        position: standings.length + index + 1,
        games_played: 0,
        wins: 0,
        losses: 0,
        points: 0,
        created_at: null,
        updated_at: null,
      })),
  ];

  const displayLeagueName =
    league.id === "f88f2e61-9bb0-4e8f-9b5b-e563db6b0cbf"
      ? "easyCreditBBL"
      : league.name;

  function gameList(games: LeagueGame[], upcoming: boolean) {
    if (gamesLoading) return <Skeleton className="mt-4 h-40 w-full" />;
    if (gamesError)
      return (
        <p role="alert" className="mt-4 text-destructive">
          {gamesError}
        </p>
      );
    if (!games.length)
      return (
        <Card className="mt-4">
          <CardContent className="p-6 text-muted-foreground">
            {upcoming
              ? "Keine kommenden Spiele vorhanden."
              : "Keine letzten Ergebnisse vorhanden."}
          </CardContent>
        </Card>
      );
    return (
      <div className="mt-4 space-y-3">
        {games.map((game) => (
          <div
            key={game.id}
            className="flex flex-col gap-2 sm:flex-row sm:items-center"
          >
            <div className="min-w-0 flex-1">
              <GameCard game={game} upcoming={upcoming} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-6">
      {backButton}
      {/* Liga-Informationen */}
      <section className="mt-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-4xl font-bold tracking-tight break-words">
              {displayLeagueName}
            </h1>

            <div className="mt-4 flex flex-wrap gap-x-10 gap-y-3 text-lg">
              {league.season && (
                <p>
                  <span className="font-semibold">Saison:</span>{" "}
                  <span className="text-muted-foreground">{league.season}</span>
                </p>
              )}

              {league.age_group && (
                <p>
                  <span className="font-semibold">Altersklasse:</span>{" "}
                  <span className="text-muted-foreground">
                    {league.age_group}
                  </span>
                </p>
              )}

              {league.division && (
                <p>
                  <span className="font-semibold">Spielklasse:</span>{" "}
                  <span className="text-muted-foreground">
                    {league.division}
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8" aria-labelledby="upcoming-title">
        <h2 id="upcoming-title" className="text-2xl font-semibold">
          Next Games
        </h2>
        {gameList(selectedUpcomingGames, true)}
      </section>
      <section className="mt-10" aria-labelledby="standings-title">
        <h2 id="standings-title" className="text-2xl font-semibold">
          Standings
        </h2>
        {standingsLoading ? (
          <Skeleton className="mt-4 h-64 w-full" />
        ) : standingsError ? (
          <p role="alert" className="mt-4 text-destructive">
            {standingsError}
          </p>
        ) : tableRows.length ? (
          <>
            <StandingsTable standings={tableRows} />
            <p className="mt-3 text-xs text-muted-foreground">
              Sp. = Spiele · S = Siege · N = Niederlagen · Pkt. = Punkte
            </p>
          </>
        ) : (
          <p className="mt-4 text-muted-foreground">
            Keine Mannschaften vorhanden.
          </p>
        )}
      </section>
      <section className="mt-10" aria-labelledby="results-title">
        <h2 id="results-title" className="text-2xl font-semibold">
          Scores
        </h2>
        {pastMatchdays.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/20 p-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Vorheriger Spieltag"
              disabled={activePastIndex <= 0}
              onClick={() =>
                setSelectedPastMatchday(pastMatchdays[activePastIndex - 1])
              }
            >
              <ChevronLeft />
            </Button>
            <div className="order-3 flex w-full justify-center sm:order-none sm:w-auto">
              <Select
                value={activePastMatchday ?? ""}
                onValueChange={(value) => {
                  if (value) setSelectedPastMatchday(value);
                }}
              >
                <SelectTrigger className="w-[190px]">
                  <SelectValue placeholder="Spieltag auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {pastMatchdays.map((matchday, index) => (
                    <SelectItem key={matchday} value={matchday}>
                      {matchday.startsWith("matchday-")
                        ? `Spieltag ${matchday.replace("matchday-", "")}`
                        : `Spieltag ${index + 1}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <span className="text-center text-sm font-medium">
              {activePastMatchday?.startsWith("matchday-")
                ? `Spieltag ${activePastMatchday.replace("matchday-", "")}`
                : new Intl.DateTimeFormat("de-DE", {
                    dateStyle: "medium",
                  }).format(
                    new Date(
                      `${activePastMatchday?.replace("date-", "")}T00:00:00`
                    )
                  )}
              <span className="ml-2 text-muted-foreground">
                ({formatMatchdayDateRange()})
              </span>
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Nächster Spieltag"
              disabled={activePastIndex >= pastMatchdays.length - 1}
              onClick={() =>
                setSelectedPastMatchday(pastMatchdays[activePastIndex + 1])
              }
            >
              <ChevronRight />
            </Button>
          </div>
        )}
        {gameList(selectedPastGames, false)}
      </section>
    </main>
  );
}

export default LeagueDetailPage;

import { ArrowLeft, Plus, Pencil } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import GameCard from "@/components/games/GameCard";
import StandingsTable from "@/components/standings/StandingsTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLeagueGames, type LeagueGame } from "@/hooks/games/useLeagueGames";
import { useLeagueDetail } from "@/hooks/leagues/useLeagueDetail";
import { useLeagueStandings } from "@/hooks/standings/useLeagueStandings";

import { useState } from "react";
import { createLeaguePreview } from "@/lib/league-preview";

function LeagueDetailPage() {
  const { leagueId } = useParams<{ leagueId: string }>();
  const navigate = useNavigate();
  const [showDemo, setShowDemo] = useState(true);
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
      onClick={() => navigate(-1)}
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

  const preview = createLeaguePreview(teams, league.id);
  const displayedPast = showDemo ? preview.past : pastGames;
  const displayedUpcoming = showDemo ? preview.upcoming : upcomingGames;
  const tableRows = showDemo
    ? preview.standings
    : [
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

  function gameList(games: LeagueGame[], upcoming: boolean) {
    if (!showDemo && gamesLoading)
      return <Skeleton className="mt-4 h-40 w-full" />;
    if (!showDemo && gamesError)
      return (
        <p role="alert" className="mt-4 text-destructive">
          {gamesError}
        </p>
      );
    if (!games.length)
      return (
        <Card className="mt-4">
          <CardContent className="p-6 text-muted-foreground">
            {showDemo
              ? "Für Beispielspiele werden mindestens zwei Teams benötigt."
              : upcoming
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
            {!showDemo && (
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  navigate(`/leagues/${leagueId}/games/${game.id}/edit`)
                }
              >
                <Pencil /> Bearbeiten
              </Button>
            )}
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
              {league.name}
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

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
        <div>
          <p className="font-semibold">
            {showDemo ? "Demo-Vorschau" : "Gespeicherte Ligadaten"}
          </p>
          <p className="text-sm text-muted-foreground">
            {showDemo
              ? "Beispielergebnisse und Termine mit den vorhandenen Teams. Es werden keine Daten gespeichert."
              : "Teams ohne Tabellenstand werden mit 0 Spielen angezeigt."}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          aria-pressed={showDemo}
          onClick={() => setShowDemo(!showDemo)}
        >
          {showDemo ? "Echte Daten anzeigen" : "Beispieldaten anzeigen"}
        </Button>
      </div>
      <section className="mt-8" aria-labelledby="results-title">
        <h2 id="results-title" className="text-2xl font-semibold">
          Letzte Spiele & Ergebnisse
        </h2>
        {gameList(displayedPast, false)}
      </section>
      <section className="mt-10" aria-labelledby="standings-title">
        <h2 id="standings-title" className="text-2xl font-semibold">
          Tabelle
        </h2>
        {!showDemo && standingsLoading ? (
          <Skeleton className="mt-4 h-64 w-full" />
        ) : !showDemo && standingsError ? (
          <p role="alert" className="mt-4 text-destructive">
            {standingsError}
          </p>
        ) : tableRows.length ? (
          <>
            <StandingsTable standings={tableRows} />
            <p className="mt-3 text-xs text-muted-foreground">
              Sp. = Spiele · S = Siege · N = Niederlagen · Pkt. = Punkte
              {showDemo ? " · Demo: 2 Punkte pro Sieg" : ""}
            </p>
          </>
        ) : (
          <p className="mt-4 text-muted-foreground">
            Keine Mannschaften vorhanden.
          </p>
        )}
      </section>
      <section className="mt-10" aria-labelledby="upcoming-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="upcoming-title" className="text-2xl font-semibold">
            Kommende Spiele
          </h2>
          <Button
            type="button"
            onClick={() => navigate(`/leagues/${league.id}/games/create`)}
          >
            <Plus /> Spiel hinzufügen
          </Button>
        </div>
        {gameList(displayedUpcoming, true)}
      </section>
    </main>
  );
}

export default LeagueDetailPage;

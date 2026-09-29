import { ArrowLeft, Plus, Pencil } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";

import GameCard from "@/components/games/GameCard";
import StandingsTable from "@/components/standings/StandingsTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLeagueGames } from "@/hooks/games/useLeagueGames";
import { useLeagueDetail } from "@/hooks/leagues/useLeagueDetail";
import { useLeagueStandings } from "@/hooks/standings/useLeagueStandings";

function LeagueDetailPage() {
  const { leagueId } = useParams<{ leagueId: string }>();
  const navigate = useNavigate();

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

  if (leagueLoading) {
    return (
      <main className="container mx-auto px-4 py-6">
        <Skeleton className="mb-6 h-10 w-48" />

        <Skeleton className="h-12 w-72" />

        <div className="mt-4 flex flex-wrap gap-6">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-6 w-40" />
        </div>

        <section className="mt-8">
          <Skeleton className="h-8 w-48" />

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-2/3" />
                  <Skeleton className="mt-2 h-5 w-1/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    );
  }

  if (leagueError || !league) {
    return (
      <main className="container mx-auto px-4 py-6">
        <Card>
          <CardContent className="p-6">
            <h1 className="text-lg font-semibold">
              Liga konnte nicht geladen werden
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              {leagueError ?? "Die Liga wurde nicht gefunden."}
            </p>

            <Button
              asChild
              className="w-full shrink-0 bg-orange-500 text-white hover:bg-orange-600 sm:w-auto"
            >
              <Link
                to={`/leagues/${league.id}/games/${game.id}/edit`}
                className="flex items-center justify-center gap-2"
              >
                <Pencil className="size-4 shrink-0" />
                <span>Bearbeiten</span>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-6">
      <Button
        type="button"
        variant="ghost"
        className="text-orange-500 hover:bg-transparent hover:text-orange-400"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="size-5 shrink-0" />
        <span>Zurück</span>
      </Button>

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

      {/* Mannschaften */}
      <section className="mt-8">
        <h2 className="text-2xl font-semibold tracking-tight">Mannschaften</h2>

        {teams.length === 0 ? (
          <Card className="mt-4">
            <CardContent className="p-6">
              <h3 className="font-semibold">Keine Mannschaften vorhanden</h3>

              <p className="mt-1 text-sm text-muted-foreground">
                Für diese Liga wurden noch keine Mannschaften hinterlegt.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {teams.map((team) => (
              <Link
                key={team.id}
                to={`/clubs/${team.club_id}/teams/${team.id}`}
                className="block h-full"
              >
                <Card className="h-full transition-colors hover:bg-muted/50">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold">{team.name}</h3>

                    <p className="mt-1 text-muted-foreground">
                      {team.age_group}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Spielplan & Ergebnisse */}
      <section className="mt-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">
            Spielplan & Ergebnisse
          </h2>

          <Button asChild className="w-full whitespace-nowrap sm:w-auto">
            <Link
              to={`/leagues/${league.id}/games/create`}
              className="flex items-center justify-center gap-2"
            >
              <Plus className="size-4 shrink-0" />
              <span>Spiel hinzufügen</span>
            </Link>
          </Button>
        </div>

        {gamesLoading ? (
          <div className="mt-4 space-y-4">
            {Array.from({ length: 2 }).map((_, index) => (
              <Card key={index}>
                <CardContent className="p-5">
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="mt-4 h-6 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : gamesError ? (
          <Card className="mt-4">
            <CardContent className="p-6">
              <h3 className="font-semibold">
                Spiele konnten nicht geladen werden
              </h3>

              <p className="mt-2 text-sm text-destructive">{gamesError}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-6 space-y-8">
            {/* Kommende Spiele */}
            <section>
              <h3 className="text-lg font-semibold">Kommende Spiele</h3>

              {upcomingGames.length === 0 ? (
                <Card className="mt-3">
                  <CardContent className="p-6">
                    <p className="text-sm text-muted-foreground">
                      Keine kommenden Spiele vorhanden.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="mt-3 space-y-3">
                  {upcomingGames.map((game) => (
                    <div
                      key={game.id}
                      className="flex flex-col gap-3 sm:flex-row sm:items-stretch"
                    >
                      <div className="min-w-0 flex-1">
                        <GameCard game={game} />
                      </div>

                      <Button asChild className="w-full shrink-0 sm:w-auto">
                        <Link
                          to={`/leagues/${league.id}/games/${game.id}/edit`}
                          className="flex w-full items-center justify-center gap-2"
                        >
                          <Pencil className="size-4 shrink-0" />
                          <span>Bearbeiten</span>
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Vergangene Spiele */}
            <section>
              <h3 className="text-lg font-semibold">Vergangene Spiele</h3>

              {pastGames.length === 0 ? (
                <Card className="mt-3">
                  <CardContent className="p-6">
                    <p className="text-sm text-muted-foreground">
                      Keine vergangenen Spiele vorhanden.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="mt-3 space-y-3">
                  {pastGames.map((game) => (
                    <div
                      key={game.id}
                      className="flex flex-col gap-3 sm:flex-row sm:items-stretch"
                    >
                      <div className="min-w-0 flex-1">
                        <GameCard game={game} />
                      </div>

                      <Button asChild className="w-full shrink-0 sm:w-auto">
                        <Link
                          to={`/leagues/${league.id}/games/${game.id}/edit`}
                          className="flex w-full items-center justify-center gap-2"
                        >
                          <Pencil className="size-4 shrink-0" />
                          <span>Bearbeiten</span>
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </section>

      {/* Tabellenstand */}
      <section className="mt-10">
        <h2 className="text-2xl font-semibold tracking-tight">Tabelle</h2>

        {standingsLoading ? (
          <Card className="mt-4">
            <CardContent className="p-6">
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-5 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        ) : standingsError ? (
          <Card className="mt-4">
            <CardContent className="p-6">
              <h3 className="font-semibold">
                Tabelle konnte nicht geladen werden
              </h3>

              <p className="mt-2 text-sm text-destructive">{standingsError}</p>
            </CardContent>
          </Card>
        ) : standings.length === 0 ? (
          <Card className="mt-4">
            <CardContent className="p-6">
              <h3 className="font-semibold">Keine Tabelle vorhanden</h3>

              <p className="mt-1 text-sm text-muted-foreground">
                Für diese Liga wurden noch keine Tabellenstände hinterlegt.
              </p>
            </CardContent>
          </Card>
        ) : (
          <StandingsTable standings={standings} />
        )}
      </section>
    </main>
  );
}

export default LeagueDetailPage;

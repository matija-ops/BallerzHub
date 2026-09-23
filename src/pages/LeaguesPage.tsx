import LeagueCard from "@/components/leagues/LeagueCard";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLeagues } from "@/hooks/leagues/useLeagues";

function LeaguesPage() {
  const { leagues, isLoading, error } = useLeagues();

  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-6">
        <header className="mb-6">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="mt-2 h-5 w-80 max-w-full" />
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="p-5">
                <Skeleton className="h-6 w-3/4" />

                <div className="mt-4 space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="container mx-auto px-4 py-6">
        <Card>
          <CardContent className="p-6">
            <h1 className="text-lg font-semibold">
              Ligen konnten nicht geladen werden
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Ligen</h1>
        <p className="mt-2 text-muted-foreground">
          Entdecke Ligen, Spielklassen und ihre Mannschaften.
        </p>
      </header>

      {leagues.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <h2 className="font-semibold">Keine Ligen vorhanden</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Aktuell wurden noch keine Ligen angelegt.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {leagues.map((league) => (
            <LeagueCard key={league.id} league={league} />
          ))}
        </div>
      )}
    </main>
  );
}

export default LeaguesPage;

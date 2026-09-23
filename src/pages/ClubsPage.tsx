import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import ClubCard from "@/components/clubs/ClubCard";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useClubs } from "@/hooks/clubs/useClubs";

function ClubsPage() {
  const { clubs, isLoading, error } = useClubs();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredClubs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return clubs;
    }

    return clubs.filter((club) => {
      return (
        club.name.toLowerCase().includes(query) ||
        club.description.toLowerCase().includes(query)
      );
    });
  }, [clubs, searchQuery]);

  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="mt-2 h-5 w-72 max-w-full" />
        </div>

        <div className="mb-6">
          <Skeleton className="h-10 w-full" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="flex gap-4 p-5">
                <Skeleton className="size-20 shrink-0 rounded-lg" />

                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
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
              Vereine konnten nicht geladen werden
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
        <h1 className="text-3xl font-bold tracking-tight">Vereine</h1>

        <p className="mt-2 text-muted-foreground">
          Entdecke Basketballvereine und ihre Mannschaften.
        </p>
      </header>

      {clubs.length > 0 && (
        <div className="relative mb-6">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            type="search"
            placeholder="Verein suchen ..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="pl-9"
            aria-label="Verein suchen"
          />
        </div>
      )}

      {clubs.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <h2 className="font-semibold">Keine Vereine vorhanden</h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Aktuell wurden noch keine Vereine angelegt.
            </p>
          </CardContent>
        </Card>
      ) : filteredClubs.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="font-semibold">Keine Vereine gefunden</h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Für „{searchQuery}“ wurden keine passenden Vereine gefunden.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredClubs.map((club) => (
            <ClubCard key={club.id} club={club} />
          ))}
        </div>
      )}
    </main>
  );
}

export default ClubsPage;

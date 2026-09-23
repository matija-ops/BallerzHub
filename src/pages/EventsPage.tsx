import { useMemo, useState } from "react";
import { CalendarDays, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import EventCard from "@/components/events/EventCard";
import EventFilters, {
  type EventFilterValues,
} from "@/components/events/EventFilters";
import { useEvents } from "@/hooks/events/useEvents";
import type { Tables } from "@/types/supabase.types";

type Event = Tables<"events">;

const initialFilters: EventFilterValues = {
  date: "",
  location: "",
  category: "all",
  ageGroup: "all",
};

function normalize(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function EventsPage() {
  const navigate = useNavigate();

  const { events, isLoading, error, refetch } = useEvents();

  const [filters, setFilters] = useState<EventFilterValues>(initialFilters);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (filters.date && event.event_date !== filters.date) {
        return false;
      }

      if (
        filters.location &&
        !normalize(event.location).includes(normalize(filters.location))
      ) {
        return false;
      }

      if (
        filters.category !== "all" &&
        normalize(event.category) !== normalize(filters.category)
      ) {
        return false;
      }

      if (
        filters.ageGroup !== "all" &&
        normalize(event.age_group) !== normalize(filters.ageGroup)
      ) {
        return false;
      }

      return true;
    });
  }, [events, filters]);

  function handleResetFilters() {
    setFilters(initialFilters);
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <p className="text-muted-foreground">Events werden geladen …</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <p className="text-center">Die Events konnten nicht geladen werden.</p>

        <Button type="button" onClick={() => void refetch()}>
          Erneut versuchen
        </Button>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-6 md:py-10">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Events</h1>

            <p className="mt-2 text-muted-foreground">
              Entdecke Basketball-Events in deiner Nähe.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/events/calendar")}
            >
              <CalendarDays className="h-4 w-4" />
              Kalender
            </Button>

            <Button type="button" onClick={() => navigate("/events/create")}>
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Event erstellen</span>
            </Button>
          </div>
        </div>

        <EventFilters
          filters={filters}
          onChange={setFilters}
          onReset={handleResetFilters}
          resultCount={filteredEvents.length}
        />

        {filteredEvents.length === 0 ? (
          <div className="rounded-xl border border-dashed p-10 text-center">
            <h2 className="text-lg font-semibold">Keine passenden Events</h2>

            <p className="mt-2 text-sm text-muted-foreground">
              Für deine aktuelle Filterauswahl wurden keine Events gefunden.
            </p>

            <Button
              type="button"
              variant="outline"
              className="mt-6"
              onClick={handleResetFilters}
            >
              Filter zurücksetzen
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredEvents.map((event: Event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default EventsPage;

import { useMemo, useState } from "react";
import { CalendarDays, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import EventCard from "@/components/events/EventCard";
import EventFilters, {
  type EventFilterValues,
} from "@/components/events/EventFilters";
import EventForm from "@/components/events/EventForm";

import { useEvents } from "@/hooks/events/useEvents";
import { useCreateEvent } from "@/hooks/events/useCreateEvent";

import type { EventFormValues } from "@/lib/events/event-validation";


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
  const { events, isLoading, error, refetch } = useEvents();

  const {
    createEvent,
    isSubmitting,
    error: createEventError,
  } = useCreateEvent();

  const [filters, setFilters] = useState<EventFilterValues>(initialFilters);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const normalizedLocation = normalize(event.location);
      const normalizedCategory = normalize(event.category);
      const normalizedAgeGroup = normalize(event.age_group);

      const matchesDate = !filters.date || event.event_date === filters.date;

      const matchesLocation =
        !filters.location ||
        normalizedLocation.includes(normalize(filters.location));

      const matchesCategory =
        filters.category === "all" ||
        normalizedCategory === normalize(filters.category);

      const matchesAgeGroup =
        filters.ageGroup === "all" ||
        normalizedAgeGroup.includes(normalize(filters.ageGroup));

      return (
        matchesDate && matchesLocation && matchesCategory && matchesAgeGroup
      );
    });
  }, [events, filters]);

  function handleResetFilters() {
    setFilters(initialFilters);
  }

  async function handleCreateEvent(values: EventFormValues, images: File[]) {
    const event = await createEvent(values, images);

    if (!event) {
      return;
    }

    setIsCreateDialogOpen(false);

    void refetch();
  }

  return (
    <div className="container mx-auto space-y-8 px-4 py-8">
      {/* Header */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <CalendarDays className="h-5 w-5 text-primary" />
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight">Events</h1>

              <p className="text-muted-foreground">
                Basketball-Events in deiner Umgebung
              </p>
            </div>
          </div>
        </div>

        <Button type="button" onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Event erstellen
        </Button>
      </div>

      {/* Filter */}

      <EventFilters
        filters={filters}
        onChange={setFilters}
        onReset={handleResetFilters}
        resultCount={filteredEvents.length}
      />

      {/* Laden */}

      {isLoading && (
        <div className="flex min-h-48 items-center justify-center rounded-xl border bg-card">
          <p className="text-sm text-muted-foreground">
            Events werden geladen ...
          </p>
        </div>
      )}

      {/* Fehler beim Laden */}

      {!isLoading && error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
          <p className="font-medium text-destructive">
            Die Events konnten nicht geladen werden.
          </p>

          <p className="mt-1 text-sm text-muted-foreground">{error}</p>

          <Button
            type="button"
            variant="outline"
            className="mt-4"
            onClick={() => void refetch()}
          >
            Erneut versuchen
          </Button>
        </div>
      )}

      {/* Keine Events */}

      {!isLoading && !error && filteredEvents.length === 0 && (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 px-6 text-center">
          <CalendarDays className="mb-4 h-10 w-10 text-muted-foreground" />

          <h2 className="text-lg font-semibold">Keine Events gefunden</h2>

          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Es wurden keine Events gefunden, die zu deinen aktuellen Filtern
            passen.
          </p>

          <Button
            type="button"
            variant="outline"
            className="mt-4"
            onClick={handleResetFilters}
          >
            Filter zurücksetzen
          </Button>
        </div>
      )}

      {/* Event-Liste */}

      {!isLoading && !error && filteredEvents.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}

      {/* Event erstellen Dialog */}

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Event erstellen</DialogTitle>

            <DialogDescription>
              Erstelle ein neues Basketball-Event und füge optional bis zu zwei
              Bilder hinzu.
            </DialogDescription>
          </DialogHeader>

          {createEventError && (
            <div
              className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
              role="alert"
            >
              {createEventError}
            </div>
          )}

          <EventForm isSubmitting={isSubmitting} onSubmit={handleCreateEvent} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default EventsPage;

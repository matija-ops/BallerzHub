import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/react/daygrid";
import timeGridPlugin from "@fullcalendar/react/timegrid";
import listPlugin from "@fullcalendar/react/list";

import "@fullcalendar/react/skeleton.css";

import { Button } from "@/components/ui/button";
import { useEvents } from "@/hooks/events/useEvents";

import { EventCalendar } from "@/components/event-calendar";

function EventCalendarPage() {
  const navigate = useNavigate();

  const { events, isLoading, error, refetch } = useEvents();

  const calendarEvents = useMemo(
    () =>
      events.map((event) => ({
        id: event.id,
        title: event.name,
        start: `${event.event_date}T${event.event_time}`,
      })),
    [events]
  );

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <p className="text-muted-foreground">Kalender wird geladen …</p>
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
    <main className="min-h-screen bg-background px-4 py-8 md:px-6 md:py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-bold tracking-[0.18em] text-orange-500 uppercase">
            <span>🏀</span>
            <span>Event-Kalender</span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl border bg-card shadow-sm">
          <div className="pointer-events-none absolute -top-24 -right-20 h-64 w-64 rounded-full border-[2px] border-orange-500/10" />

          <div className="pointer-events-none absolute -top-12 -right-8 h-40 w-40 rounded-full border-[2px] border-orange-500/10" />

          <div className="basketball-calendar">
            <EventCalendar
              events={calendarEvents}
              eventClick={(info) => {
                navigate(`/events/${info.event.id}`);
              }}
              locale="de"
            />
          </div>
        </div>
      </div>
    </main>
  );
}

export default EventCalendarPage;

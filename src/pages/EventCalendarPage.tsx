import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/react/daygrid";
import timeGridPlugin from "@fullcalendar/react/timegrid";
import listPlugin from "@fullcalendar/react/list";

import "@fullcalendar/react/skeleton.css";

import { Button } from "@/components/ui/button";
import { useEvents } from "@/hooks/events/useEvents";

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

          <h1 className="text-3xl font-black tracking-tight md:text-4xl">
            Basketball-Events
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Alle Events auf einen Blick.
          </p>
        </div>

        <div className="relative overflow-hidden rounded-3xl border bg-card shadow-sm">
          <div className="pointer-events-none absolute -top-24 -right-20 h-64 w-64 rounded-full border-[2px] border-orange-500/10" />

          <div className="pointer-events-none absolute -top-12 -right-8 h-40 w-40 rounded-full border-[2px] border-orange-500/10" />

          <style>
            {`
              .basketball-calendar {
                position: relative;
              }

              .basketball-calendar .fc {
                --fc-border-color: rgba(15, 23, 42, 0.08);
                --fc-page-bg-color: transparent;
                --fc-neutral-bg-color: rgba(15, 23, 42, 0.025);
                --fc-today-bg-color: rgba(249, 115, 22, 0.07);
                --fc-event-bg-color: #f97316;
                --fc-event-border-color: #f97316;
                --fc-event-text-color: #ffffff;
                font-family: inherit;
              }

              .basketball-calendar .fc-header-toolbar {
                margin-bottom: 0 !important;
              }

              .basketball-calendar .fc-toolbar.fc-header-toolbar {
                padding: 24px 24px 18px;
              }

              .basketball-calendar .fc-toolbar-title {
                color: #111827;
                font-size: 1.6rem;
                font-weight: 900;
                letter-spacing: -0.04em;
              }

              .basketball-calendar .fc-button-group {
                display: flex;
                gap: 4px;
                padding: 4px;
                border-radius: 12px;
                background: rgba(15, 23, 42, 0.05);
              }

              .basketball-calendar .fc-button {
                min-height: 34px;
                border: 0 !important;
                border-radius: 8px !important;
                background: transparent !important;
                color: #64748b !important;
                box-shadow: none !important;
                font-size: 0.75rem;
                font-weight: 700;
                text-transform: none;
                transition:
                  background-color 150ms ease,
                  color 150ms ease,
                  box-shadow 150ms ease;
              }

              .basketball-calendar .fc-button:hover {
                background: rgba(255, 255, 255, 0.75) !important;
                color: #111827 !important;
              }

              .basketball-calendar .fc-button-active {
                background: #f97316 !important;
                color: white !important;
                box-shadow: 0 2px 6px rgba(249, 115, 22, 0.25) !important;
              }

              .basketball-calendar .fc-button:focus {
                box-shadow: none !important;
              }

              .basketball-calendar .fc-col-header-cell {
                border-top: 0;
                background: rgba(15, 23, 42, 0.025);
              }

              .basketball-calendar .fc-col-header-cell-cushion {
                padding: 9px 4px;
                color: #64748b;
                font-size: 0.68rem;
                font-weight: 800;
                letter-spacing: 0.08em;
                text-transform: uppercase;
              }

              .basketball-calendar .fc-theme-standard td,
              .basketball-calendar .fc-theme-standard th {
                border-color: rgba(15, 23, 42, 0.07);
              }

              .basketball-calendar .fc-daygrid-day-frame {
                min-height: 76px;
              }

              .basketball-calendar .fc-daygrid-day-number {
                padding: 8px;
                color: #334155;
                font-size: 0.75rem;
                font-weight: 700;
              }

              .basketball-calendar .fc-day-other .fc-daygrid-day-number {
                color: #cbd5e1;
              }

              .basketball-calendar .fc-day-today {
                background: rgba(249, 115, 22, 0.07) !important;
              }

              .basketball-calendar .fc-day-today .fc-daygrid-day-number {
                display: flex;
                width: 28px;
                height: 28px;
                align-items: center;
                justify-content: center;
                margin: 4px;
                padding: 0;
                border-radius: 9999px;
                background: #f97316;
                color: white;
                font-weight: 900;
              }

              .basketball-calendar .fc-event {
                margin: 3px 5px;
                border: 0;
                border-radius: 9999px;
                padding: 3px 7px;
                background: #f97316;
                color: white;
                font-size: 0.68rem;
                font-weight: 700;
                cursor: pointer;
                box-shadow: 0 2px 5px rgba(249, 115, 22, 0.2);
              }

              .basketball-calendar .fc-event:hover {
                opacity: 0.95;
                transform: translateY(-1px);
                box-shadow: 0 4px 9px rgba(249, 115, 22, 0.25);
              }

              .basketball-calendar .fc-footer-toolbar {
                display: grid !important;
                grid-template-columns: 1fr 1fr;
                align-items: center;
                margin: 0 !important;
                padding: 14px 20px 20px;
                border-top: 1px solid rgba(15, 23, 42, 0.07);
              }

              .basketball-calendar .fc-footer-toolbar .fc-toolbar-chunk {
                display: flex;
                align-items: center;
              }

              .basketball-calendar .fc-footer-toolbar .fc-toolbar-chunk:last-child {
                justify-content: flex-end;
              }

              .basketball-calendar .fc-footer-toolbar .fc-button {
                display: flex;
                width: 40px;
                height: 40px;
                min-height: 40px;
                align-items: center;
                justify-content: center;
                padding: 0;
                border: 1px solid rgba(249, 115, 22, 0.35) !important;
                border-radius: 9999px !important;
                background: white !important;
                color: #111827 !important;
                font-size: 0;
              }

              .basketball-calendar .fc-footer-toolbar .fc-button:hover {
                border-color: #f97316 !important;
                background: #f97316 !important;
                color: white !important;
              }

              .basketball-calendar .fc-footer-toolbar .fc-button:first-child::before {
                content: "←";
                font-size: 1.15rem;
                font-weight: 700;
              }

              .basketball-calendar .fc-footer-toolbar .fc-button:last-child::before {
                content: "→";
                font-size: 1.15rem;
                font-weight: 700;
              }

              .basketball-calendar .fc-timegrid-slot-label {
                color: #94a3b8;
                font-size: 0.68rem;
              }

              .basketball-calendar .fc-timegrid-axis {
                background: rgba(15, 23, 42, 0.02);
              }

              .basketball-calendar .fc-list {
                border: 0;
              }

              .basketball-calendar .fc-list-day-cushion {
                padding: 9px 12px;
                background: rgba(15, 23, 42, 0.04);
                color: #111827;
                font-weight: 800;
              }

              .basketball-calendar .fc-list-event td {
                padding: 11px 12px;
              }

              .basketball-calendar .fc-list-event:hover td {
                background: rgba(249, 115, 22, 0.05);
              }

              @media (max-width: 640px) {
                .basketball-calendar .fc-header-toolbar {
                  flex-direction: column;
                  padding: 18px 12px 14px;
                }

                .basketball-calendar .fc-header-toolbar .fc-toolbar-chunk {
                  width: 100%;
                  justify-content: center;
                }

                .basketball-calendar .fc-toolbar-title {
                  font-size: 1.25rem;
                }

                .basketball-calendar .fc-button {
                  min-height: 32px;
                  padding: 0 9px;
                  font-size: 0.68rem;
                }

                .basketball-calendar .fc-daygrid-day-frame {
                  min-height: 54px;
                }

                .basketball-calendar .fc-daygrid-day-number {
                  padding: 5px;
                  font-size: 0.68rem;
                }

                .basketball-calendar .fc-col-header-cell-cushion {
                  padding: 6px 2px;
                  font-size: 0.58rem;
                }

                .basketball-calendar .fc-event {
                  margin: 2px;
                  padding: 2px 4px;
                  font-size: 0.58rem;
                }

                .basketball-calendar .fc-footer-toolbar {
                  padding: 10px 12px 14px;
                }

                .basketball-calendar .fc-footer-toolbar .fc-button {
                  width: 36px;
                  height: 36px;
                  min-height: 36px;
                }
              }
            `}
          </style>

          <div className="basketball-calendar">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, listPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: "",
                center: "title",
                right: "dayGridMonth,timeGridWeek,listMonth",
              }}
              footerToolbar={{
                left: "prev",
                center: "",
                right: "next",
              }}
              buttonText={{
                month: "Monat",
                week: "Woche",
                list: "Liste",
              }}
              titleFormat={{
                year: "numeric",
                month: "long",
              }}
              locale="de"
              height={480}
              events={calendarEvents}
              eventClick={(info) => {
                navigate(`/events/${info.event.id}`);
              }}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

export default EventCalendarPage;

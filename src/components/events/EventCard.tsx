import { CalendarDays, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import type { Tables } from "@/types/supabase.types";

type Event = Tables<"events">;

type EventCardProps = {
  event: Event;
};

function formatEventDate(date: string) {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

function formatEventTime(time: string) {
  return time.slice(0, 5);
}

function isEventPast(event: Event) {
  const eventDateTime = new Date(`${event.event_date}T${event.event_time}`);

  return eventDateTime.getTime() < Date.now();
}

function EventCard({ event }: EventCardProps) {
  const isPast = isEventPast(event);

  return (
    <Card className="overflow-hidden">
      <div className="flex h-44 items-center justify-center bg-muted">
        <span className="text-sm font-medium text-muted-foreground">
          Basketball Event
        </span>
      </div>

      <CardHeader className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {event.category && (
            <Badge variant="secondary">{event.category}</Badge>
          )}

          {isPast && <Badge variant="outline">Vergangen</Badge>}
        </div>

        <CardTitle className="line-clamp-2">
          {event.name || "Unbenanntes Event"}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <CalendarDays className="mt-0.5 h-4 w-4 shrink-0" />

          <span>
            {formatEventDate(event.event_date)}
            {" · "}
            {formatEventTime(event.event_time)} Uhr
          </span>
        </div>

        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0" />

          <span className="line-clamp-2">
            {event.location || "Ort nicht angegeben"}
          </span>
        </div>
      </CardContent>

      <CardFooter>
        <Button asChild className="w-full">
          <Link to={`/events/${event.id}`}>Event ansehen</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default EventCard;

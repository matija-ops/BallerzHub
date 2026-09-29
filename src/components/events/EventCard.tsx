import { useState } from "react";
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
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

import type { EventWithImages } from "@/hooks/events/useEvents";

type EventCardProps = {
  event: EventWithImages;
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

function isEventPast(event: EventWithImages) {
  const eventDateTime = new Date(`${event.event_date}T${event.event_time}`);

  return eventDateTime.getTime() < Date.now();
}

function EventCard({ event }: EventCardProps) {
  const isPast = isEventPast(event);

  const eventImage = event.event_images?.[0];

  const [isImageOpen, setIsImageOpen] = useState(false);

  return (
    <>
      <Card className="overflow-hidden pt-0">
        {/* Eventbild */}
        <div
          className="h-44 cursor-pointer bg-muted"
          onClick={() => {
            if (eventImage?.image_url) {
              setIsImageOpen(true);
            }
          }}
        >
          {eventImage?.image_url ? (
            <img
              src={eventImage.image_url}
              alt={event.name || "Eventbild"}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-sm font-medium text-muted-foreground">
                Basketball Event
              </span>
            </div>
          )}
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
            <Link
              to={`/events/${event.id}`}
              className="flex w-full items-center justify-center"
            >
              Event ansehen
            </Link>
          </Button>
        </CardFooter>
      </Card>

      {/* Vollständiges Bild öffnen */}
      {eventImage?.image_url && (
        <Dialog open={isImageOpen} onOpenChange={setIsImageOpen}>
          <DialogContent className="max-w-[95vw] border-0 bg-transparent p-0 shadow-none">
            <DialogTitle className="sr-only">
              {event.name || "Eventbild"}
            </DialogTitle>

            <img
              src={eventImage.image_url}
              alt={event.name || "Eventbild"}
              className="max-h-[90vh] w-full object-contain"
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

export default EventCard;

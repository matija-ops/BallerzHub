import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import EventForm from "@/components/events/EventForm";
import { useUpdateEvent } from "@/hooks/events/useUpdateEvent";

import { supabase } from "@/lib/supabase";
import type { Tables } from "@/types/supabase.types";
import type { EventFormValues } from "@/lib/events/event-validation";

type Event = Tables<"events">;

function EventEditPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { updateEvent, isSubmitting, error: updateError } = useUpdateEvent();

  useEffect(() => {
    if (!eventId) {
      setEvent(null);
      setError("Kein Event angegeben.");
      setIsLoading(false);
      return;
    }

    const currentEventId = eventId;

    async function fetchEvent() {
      setIsLoading(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setEvent(null);
        setError("Du musst eingeloggt sein, um ein Event zu bearbeiten.");
        setIsLoading(false);
        return;
      }

      const { data, error: supabaseError } = await supabase
        .from("events")
        .select("*")
        .eq("id", currentEventId)
        .eq("created_by", user.id)
        .maybeSingle();

      if (supabaseError) {
        setEvent(null);
        setError("Das Event konnte nicht geladen werden.");
        console.error("Event konnte nicht geladen werden:", supabaseError);
        setIsLoading(false);
        return;
      }

      if (!data) {
        setEvent(null);
        setError(
          "Das Event wurde nicht gefunden oder du bist nicht der Ersteller."
        );
        setIsLoading(false);
        return;
      }

      setEvent(data);
      setIsLoading(false);
    }

    void fetchEvent();
  }, [eventId]);

  async function handleSubmit(values: EventFormValues) {
    if (!eventId) {
      return;
    }

    const updatedEvent = await updateEvent(eventId, values);

    if (!updatedEvent) {
      return;
    }

    navigate(`/events/${updatedEvent.id}`);
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <p className="text-muted-foreground">Event wird geladen …</p>
      </main>
    );
  }

  if (error || !event) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <p className="max-w-md text-center">
          {error ?? "Das Event konnte nicht geladen werden."}
        </p>

        <Button
          asChild
          variant="link"
          className="mt-4"
          onClick={() => navigate(-1)}
        >
          <span className="inline-flex items-center gap-2">
            <ArrowLeft className="size-5 shrink-0" />
            <span>Zurück</span>
          </span>
        </Button>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <Button
          asChild
          variant="link"
          className="mt-4"
          onClick={() => navigate(-1)}
        >
          <span className="inline-flex items-center gap-2">
            <ArrowLeft className="size-5 shrink-0" />
            <span>Zurück</span>
          </span>
        </Button>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-2xl">Event bearbeiten</CardTitle>
          </CardHeader>

          <CardContent>
            {updateError && (
              <div
                className="mb-6 rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
                role="alert"
              >
                {updateError}
              </div>
            )}

            <EventForm
              event={event}
              isSubmitting={isSubmitting}
              onSubmit={handleSubmit}
            />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

export default EventEditPage;

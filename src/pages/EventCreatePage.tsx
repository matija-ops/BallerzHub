import { useNavigate } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import EventForm from "@/components/events/EventForm";
import { useCreateEvent } from "@/hooks/events/useCreateEvent";

import type { EventFormValues } from "@/lib/events/event-validation";

function EventCreatePage() {
  const navigate = useNavigate();

  const { createEvent, isSubmitting, error } = useCreateEvent();

  async function handleSubmit(values: EventFormValues) {
    const event = await createEvent(values);

    if (!event) {
      return;
    }

    navigate("/events");
  }

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Event erstellen</CardTitle>
          </CardHeader>

          <CardContent>
            {error && (
              <div
                className="mb-6 rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
                role="alert"
              >
                {error}
              </div>
            )}

            <EventForm isSubmitting={isSubmitting} onSubmit={handleSubmit} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

export default EventCreatePage;

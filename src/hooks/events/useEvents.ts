import { useCallback, useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";
import type { Tables } from "@/types/supabase.types";

type Event = Tables<"events">;
type EventImage = Tables<"event_images">;

export type EventWithImages = Event & {
  event_images: EventImage[];
};

export function useEvents() {
  const [events, setEvents] = useState<EventWithImages[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const { data, error: supabaseError } = await supabase
      .from("events")
      .select(
        `
        *,
        event_images (*)
      `
      )
      .order("event_date", { ascending: true })
      .order("event_time", { ascending: true });

    if (supabaseError) {
      console.error("Events konnten nicht geladen werden:", supabaseError);

      setEvents([]);
      setError(supabaseError.message);
      setIsLoading(false);
      return;
    }

    setEvents((data ?? []) as EventWithImages[]);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void fetchEvents();
  }, [fetchEvents]);

  return {
    events,
    isLoading,
    error,
    isEmpty: !isLoading && events.length === 0,
    refetch: fetchEvents,
  };
}

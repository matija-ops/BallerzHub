import { useCallback, useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";
import type { Tables } from "@/types/supabase.types";

type Event = Tables<"events">;

export function useEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const { data, error: supabaseError } = await supabase
      .from("events")
      .select("*")
      .order("event_date", { ascending: true })
      .order("event_time", { ascending: true });
    console.log(data);
    if (supabaseError) {
      setEvents([]);
      setError(supabaseError.message);
      setIsLoading(false);
      return;
    }

    setEvents(data ?? []);
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

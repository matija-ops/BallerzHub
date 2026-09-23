import { useState } from "react";

import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/supabase.types";
import type { EventFormValues } from "@/lib/events/event-validation";

type EventUpdate = Database["public"]["Tables"]["events"]["Update"];

export function useUpdateEvent() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function updateEvent(eventId: string, values: EventFormValues) {
    setIsSubmitting(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Du musst eingeloggt sein, um ein Event zu bearbeiten.");
        return null;
      }

      const payload: EventUpdate = {
        court_id: values.court_id,
        name: values.name,
        description: values.description,
        location: values.location,
        event_date: values.event_date,
        event_time: values.event_time,
        category: values.category,
        age_group: values.age_group,
        max_teams: values.max_teams,
      };

      const { data, error: supabaseError } = await supabase
        .from("events")
        .update(payload)
        .eq("id", eventId)
        .eq("created_by", user.id)
        .select()
        .single();

      if (supabaseError) {
        setError("Das Event konnte nicht aktualisiert werden.");

        console.error("Event konnte nicht aktualisiert werden:", supabaseError);

        return null;
      }

      return data;
    } catch (error) {
      console.error(
        "Unerwarteter Fehler beim Aktualisieren des Events:",
        error
      );

      setError(
        "Beim Aktualisieren des Events ist ein unerwarteter Fehler aufgetreten."
      );

      return null;
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    updateEvent,
    isSubmitting,
    error,
  };
}

import { useState } from "react";

import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/supabase.types";
import type { EventFormValues } from "@/lib/events/event-validation";

type EventInsert = Database["public"]["Tables"]["events"]["Insert"];

export function useCreateEvent() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createEvent(values: EventFormValues) {
    setIsSubmitting(true);
    setError(null);

    try {
      /*
       * Aktuell eingeloggten Benutzer ermitteln.
       */
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Du musst eingeloggt sein, um ein Event zu erstellen.");

        return null;
      }

      /*
       * Payload entspricht dem verbindlichen
       * events-Insert-Type aus Supabase.
       */
      const payload: EventInsert = {
        created_by: user.id,
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
        .insert(payload)
        .select()
        .single();

      if (supabaseError) {
        setError("Das Event konnte nicht erstellt werden.");

        console.error("Event konnte nicht erstellt werden:", supabaseError);

        return null;
      }

      return data;
    } catch (error) {
      console.error("Unerwarteter Fehler beim Erstellen des Events:", error);

      setError(
        "Beim Erstellen des Events ist ein unerwarteter Fehler aufgetreten."
      );

      return null;
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    createEvent,
    isSubmitting,
    error,
  };
}

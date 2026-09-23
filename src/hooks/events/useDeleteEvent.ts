import { useState } from "react";

import { supabase } from "@/lib/supabase";

export function useDeleteEvent() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function deleteEvent(eventId: string) {
    setIsDeleting(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Du musst eingeloggt sein, um ein Event zu löschen.");
        return false;
      }

      const { error: supabaseError } = await supabase
        .from("events")
        .delete()
        .eq("id", eventId)
        .eq("created_by", user.id);

      if (supabaseError) {
        setError("Das Event konnte nicht gelöscht werden.");

        console.error("Event konnte nicht gelöscht werden:", supabaseError);

        return false;
      }

      return true;
    } catch (error) {
      console.error("Unerwarteter Fehler beim Löschen des Events:", error);

      setError(
        "Beim Löschen des Events ist ein unerwarteter Fehler aufgetreten."
      );

      return false;
    } finally {
      setIsDeleting(false);
    }
  }

  return {
    deleteEvent,
    isDeleting,
    error,
  };
}

export default useDeleteEvent;

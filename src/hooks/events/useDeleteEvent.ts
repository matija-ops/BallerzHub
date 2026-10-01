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

      const { data: teams, error: teamsError } = await supabase
        .from("event_teams")
        .select("id")
        .eq("event_id", eventId);

      if (teamsError) throw teamsError;

      const teamIds = (teams ?? []).map((team) => team.id);

      if (teamIds.length > 0) {
        const { error: playersError } = await supabase
          .from("event_team_players")
          .delete()
          .in("event_team_id", teamIds);

        if (playersError) throw playersError;
      }

      const dependentDeletes = await Promise.all([
        supabase.from("event_images").delete().eq("event_id", eventId),
        supabase.from("event_participants").delete().eq("event_id", eventId),
        supabase.from("event_teams").delete().eq("event_id", eventId),
      ]);

      const dependentError = dependentDeletes.find((result) => result.error)?.error;

      if (dependentError) throw dependentError;

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

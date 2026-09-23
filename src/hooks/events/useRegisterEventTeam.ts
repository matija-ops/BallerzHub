import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";

type RegisterEventTeamParams = {
  eventId: string;
  teamName: string;
  category: string;
  playerNames: string[];
};

export function useRegisterEventTeam() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registerTeam = useCallback(
    async ({
      eventId,
      teamName,
      category,
      playerNames,
    }: RegisterEventTeamParams) => {
      setIsSubmitting(true);
      setError(null);

      const trimmedTeamName = teamName.trim();
      const trimmedPlayerNames = playerNames
        .map((name) => name.trim())
        .filter(Boolean);

      if (!trimmedTeamName) {
        setError("Bitte einen Teamnamen eingeben.");
        setIsSubmitting(false);
        return false;
      }

      if (!category) {
        setError("Bitte eine Kategorie auswählen.");
        setIsSubmitting(false);
        return false;
      }

      if (trimmedPlayerNames.length === 0) {
        setError("Bitte mindestens einen Spieler eingeben.");
        setIsSubmitting(false);
        return false;
      }

      if (trimmedPlayerNames.length > 4) {
        setError("Ein 3x3-Team darf maximal 4 Spieler haben.");
        setIsSubmitting(false);
        return false;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Du musst eingeloggt sein.");
        setIsSubmitting(false);
        return false;
      }

      const { data: eventTeam, error: eventTeamError } = await supabase
        .from("event_teams")
        .insert({
          event_id: eventId,
          team_name: trimmedTeamName,
          category,
          created_by: user.id,
        })
        .select()
        .single();

      if (eventTeamError || !eventTeam) {
        setError(
          eventTeamError?.message ?? "Das Team konnte nicht angemeldet werden."
        );
        setIsSubmitting(false);
        return false;
      }

      const playerRows = trimmedPlayerNames.map((playerName) => ({
        event_team_id: eventTeam.id,
        player_name: playerName,
      }));

      const { error: playersError } = await supabase
        .from("event_team_players")
        .insert(playerRows);

      if (playersError) {
        await supabase.from("event_teams").delete().eq("id", eventTeam.id);

        setError(playersError.message);
        setIsSubmitting(false);
        return false;
      }

      setIsSubmitting(false);
      return true;
    },
    []
  );

  return {
    registerTeam,
    isSubmitting,
    error,
  };
}

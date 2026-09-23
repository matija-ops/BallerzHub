import { useCallback, useState } from "react";

import { supabase } from "@/lib/supabase";

type UpdateEventTeamParams = {
  teamId: string;
  teamName: string;
  category: string;
  playerNames: string[];
};

export function useEventTeamManagement() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const updateTeam = useCallback(
    async ({
      teamId,
      teamName,
      category,
      playerNames,
    }: UpdateEventTeamParams) => {
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

      const { data: team, error: teamError } = await supabase
        .from("event_teams")
        .update({
          team_name: trimmedTeamName,
          category,
        })
        .eq("id", teamId)
        .eq("created_by", user.id)
        .select()
        .single();

      if (teamError || !team) {
        setError(
          teamError?.message ?? "Das Team konnte nicht aktualisiert werden."
        );
        setIsSubmitting(false);
        return false;
      }

      const { error: deletePlayersError } = await supabase
        .from("event_team_players")
        .delete()
        .eq("event_team_id", teamId);

      if (deletePlayersError) {
        setError(deletePlayersError.message);
        setIsSubmitting(false);
        return false;
      }

      const playerRows = trimmedPlayerNames.map((playerName) => ({
        event_team_id: teamId,
        player_name: playerName,
      }));

      const { error: insertPlayersError } = await supabase
        .from("event_team_players")
        .insert(playerRows);

      if (insertPlayersError) {
        setError(insertPlayersError.message);
        setIsSubmitting(false);
        return false;
      }

      setIsSubmitting(false);
      return true;
    },
    []
  );

  const deleteTeam = useCallback(async (teamId: string) => {
    setIsSubmitting(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Du musst eingeloggt sein.");
      setIsSubmitting(false);
      return false;
    }

    const { error: deleteError } = await supabase
      .from("event_teams")
      .delete()
      .eq("id", teamId)
      .eq("created_by", user.id);

    if (deleteError) {
      setError(deleteError.message);
      setIsSubmitting(false);
      return false;
    }

    setIsSubmitting(false);
    return true;
  }, []);

  return {
    updateTeam,
    deleteTeam,
    isSubmitting,
    error,
  };
}

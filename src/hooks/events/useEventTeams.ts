import { useCallback, useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";
import type { Tables } from "@/types/supabase.types";

type EventTeam = Tables<"event_teams">;

type UseEventTeamsProps = {
  eventId: string;
};

export function useEventTeams({ eventId }: UseEventTeamsProps) {
  const [teams, setTeams] = useState<EventTeam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeams = useCallback(async () => {
    if (!eventId) {
      setTeams([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const { data, error: supabaseError } = await supabase
      .from("event_teams")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: true });

    if (supabaseError) {
      setTeams([]);
      setError(supabaseError.message);
      setIsLoading(false);
      return;
    }

    setTeams(data ?? []);
    setIsLoading(false);
  }, [eventId]);

  useEffect(() => {
    void fetchTeams();
  }, [fetchTeams]);

  return {
    teams,
    isLoading,
    error,
    refetch: fetchTeams,
  };
}

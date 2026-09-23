import { useEffect, useState } from "react";

import type { Tables } from "@/lib/supabase";
import { supabase } from "@/lib/supabase";

type Team = Tables<"teams">;

type UseTeamsResult = {
  teams: Team[];
  isLoading: boolean;
  error: string | null;
};

export function useTeams(): UseTeamsResult {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchTeams() {
      setIsLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from("teams")
        .select("*")
        .order("name", { ascending: true });

      if (!isMounted) {
        return;
      }

      if (supabaseError) {
        console.error("Fehler beim Laden der Mannschaften:", supabaseError);

        setTeams([]);
        setError(
          `Die Mannschaften konnten nicht geladen werden: ${supabaseError.message}`
        );
        setIsLoading(false);
        return;
      }

      setTeams(data ?? []);
      setIsLoading(false);
    }

    void fetchTeams();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    teams,
    isLoading,
    error,
  };
}

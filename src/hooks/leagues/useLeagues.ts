import { useEffect, useState } from "react";
import type { Tables } from "@/lib/supabase";
import { supabase } from "@/lib/supabase";

type League = Tables<"leagues">;

type UseLeaguesResult = {
  leagues: League[];
  isLoading: boolean;
  error: string | null;
};

export function useLeagues(): UseLeaguesResult {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchLeagues() {
      setIsLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from("leagues")
        .select("*")
        .order("name", { ascending: true });

      if (!isMounted) return;

      if (supabaseError) {
        setLeagues([]);
        setError("Die Ligen konnten nicht geladen werden.");
        setIsLoading(false);
        return;
      }

      setLeagues(data ?? []);
      setIsLoading(false);
    }

    void fetchLeagues();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    leagues,
    isLoading,
    error,
  };
}

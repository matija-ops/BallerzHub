import { useEffect, useState } from "react";

import type { Tables } from "@/lib/supabase";
import { supabase } from "@/lib/supabase";

type Club = Tables<"clubs">;

type UseClubsResult = {
  clubs: Club[];
  isLoading: boolean;
  error: string | null;
};

export function useClubs(): UseClubsResult {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchClubs() {
      setIsLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from("clubs")
        .select("*")
        .order("name", { ascending: true });

      if (!isMounted) {
        return;
      }

      if (supabaseError) {
        console.error("Fehler beim Laden der Vereine:", supabaseError);

        setClubs([]);
        setError(
          `Die Vereine konnten nicht geladen werden: ${supabaseError.message}`
        );
        setIsLoading(false);
        return;
      }

      setClubs(data ?? []);
      setIsLoading(false);
    }

    void fetchClubs();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    clubs,
    isLoading,
    error,
  };
}

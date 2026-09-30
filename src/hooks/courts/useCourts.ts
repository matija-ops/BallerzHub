import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Tables } from "@/types/supabase.types";

type Court = Tables<"courts">;

const COURTS_PAGE_SIZE = 1000;

export function useCourts() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCourts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const allCourts: Court[] = [];

    for (let from = 0; ; from += COURTS_PAGE_SIZE) {
      const { data, error: supabaseError } = await supabase
        .from("courts")
        .select("*")
        .order("id")
        .range(from, from + COURTS_PAGE_SIZE - 1);

      if (supabaseError) {
        setCourts([]);
        setError(supabaseError.message);
        setIsLoading(false);
        return;
      }

      const page = data ?? [];
      allCourts.push(...page);

      if (page.length < COURTS_PAGE_SIZE) {
        break;
      }
    }

    setCourts(allCourts);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void fetchCourts();
  }, [fetchCourts]);

  return {
    courts,
    isLoading,
    error,
    isEmpty: !isLoading && courts.length === 0,
    refetch: fetchCourts,
  };
}

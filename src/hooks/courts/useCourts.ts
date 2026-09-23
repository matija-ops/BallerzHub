import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Tables } from "@/types/supabase.types";

type Court = Tables<"courts">;

export function useCourts() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCourts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const { data, error: supabaseError } = await supabase
      .from("courts")
      .select("*");

    if (supabaseError) {
      setCourts([]);
      setError(supabaseError.message);
      setIsLoading(false);
      return;
    }
    setCourts(data ?? []);
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

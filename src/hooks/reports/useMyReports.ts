import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Tables } from "@/types/supabase.types";

type CourtReport = Tables<"court_reports">;

export function useMyReports() {
  const [reports, setReports] = useState<CourtReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadReports = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          throw new Error("Du bist nicht eingeloggt.");
        }

        const { data, error: reportsError } = await supabase
          .from("court_reports")
          .select(
            `
  *,
  court:courts!court_reports_court_id_fkey (
    name
  )
`
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (reportsError) {
          throw reportsError;
        }

        setReports(data ?? []);
      } catch (loadError) {
        console.error(
          "Meine Meldungen konnten nicht geladen werden:",
          loadError
        );

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Meine Meldungen konnten nicht geladen werden."
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadReports();
  }, []);

  return {
    reports,
    isLoading,
    error,
  };
}

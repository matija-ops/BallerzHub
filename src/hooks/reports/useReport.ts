import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";
import type { Tables } from "@/types/supabase.types";

type CourtReport = Tables<"court_reports">;
type CourtReportImage = Tables<"court_report_images">;
type ReportWithRelations = CourtReport & {
  court: { id: string; name: string } | null;
  municipality: { name: string } | null;
};

export function useReport(reportId: string) {
  const [report, setReport] = useState<ReportWithRelations | null>(null);
  const [images, setImages] = useState<CourtReportImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadReport = async () => {
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

        const { data, error: reportError } = await supabase
          .from("court_reports")
          .select(
            `
            *,
            court:courts!court_reports_court_id_fkey (
              id,
              name,
              latitude,
              longitude
            ),
            municipality:municipalities!court_reports_municipality_id_fkey (
              name
            )
          `
          )
          .eq("id", reportId)
          .eq("user_id", user.id)
          .single();

        if (reportError) {
          throw reportError;
        }

        setReport(data);

        const { data: imageData, error: imageError } = await supabase
          .from("court_report_images")
          .select("*")
          .eq("report_id", reportId)
          .order("image_order", { ascending: true });

        if (imageError) {
          throw imageError;
        }

        setImages(imageData ?? []);
      } catch (loadError) {
        console.error("Meldung konnte nicht geladen werden:", loadError);

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Meldung konnte nicht geladen werden."
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadReport();
  }, [reportId]);

  return {
    report,
    images,
    isLoading,
    error,
  };
}

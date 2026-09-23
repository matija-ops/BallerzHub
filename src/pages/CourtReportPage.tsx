import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/supabase.types";

type Court = Database["public"]["Tables"]["courts"]["Row"];

function CourtReportPage() {
  const { courtId } = useParams<{ courtId: string }>();

  const [court, setCourt] = useState<Court | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCourt = async () => {
      if (!courtId) {
        setError("Keine Court-ID vorhanden.");
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("courts")
        .select("*")
        .eq("id", courtId)
        .single();

      if (error) {
        setError("Court konnte nicht geladen werden.");
      } else {
        setCourt(data);
      }

      setLoading(false);
    };

    loadCourt();
  }, [courtId]);

  if (loading) {
    return <div className="p-6">Court wird geladen...</div>;
  }

  if (error || !court) {
    return <div className="p-6">{error ?? "Court nicht gefunden."}</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Problem melden</h1>

      <p className="mt-2">{court.name}</p>

      <p className="mt-1 text-sm text-muted-foreground">Court-ID: {court.id}</p>

      <p className="text-sm text-muted-foreground">
        Municipality-ID: {court.municipality_id}
      </p>
    </div>
  );
}

export default CourtReportPage;

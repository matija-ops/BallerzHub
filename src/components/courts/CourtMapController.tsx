import { useEffect } from "react";
import { useMap } from "react-leaflet";

import type { Tables } from "@/types/supabase.types";

type Court = Tables<"courts">;

interface CourtMapControllerProps {
  selectedCourt: Court | null;
}

export function CourtMapController({ selectedCourt }: CourtMapControllerProps) {
  const map = useMap();

  useEffect(() => {
    if (!selectedCourt) {
      return;
    }
    map.flyTo([selectedCourt.latitude, selectedCourt.longitude], 15, {
      duration: 0.8,
    });
  }, [map, selectedCourt]);
  return null;
}

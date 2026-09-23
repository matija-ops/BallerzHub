import { Marker, Popup } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import type { Tables } from "@/types/supabase.types";
import { Button } from "@base-ui/react/button";
import { ShoppingBasket } from "lucide-react";
import L from "leaflet";

type Court = Tables<"courts">;

interface CourtMarkerProps {
  court: Court;
  onSelect: (court: Court) => void;
}

export function CourtMarker({ court, onSelect }: CourtMarkerProps) {
  const position: LatLngExpression = [court.latitude, court.longitude];
  const icon = L.icon({
    iconSize: [50, 50], // size of the icon
    iconAnchor: [25, 25], // point of the icon which will correspond to marker's location
    iconUrl: "Basketball.png",
  });
  return (
    <Marker
      icon={icon}
      position={position}
      eventHandlers={{
        click: () => onSelect(court),
      }}
    >
      <Popup>
        <div className="min-w-[180px]">
          <h3 className="font-semibold">{court.name}</h3>

          <p className="mt-1 text-sm text-muted-foreground">
            {court.type} · {court.hoops_count} Körbe
          </p>

          <Button
            type="button"
            onClick={() => onSelect(court)}
            className="mt-3 text-sm font-medium text-primary"
          >
            Details öffnen
          </Button>
        </div>
      </Popup>
    </Marker>
  );
}

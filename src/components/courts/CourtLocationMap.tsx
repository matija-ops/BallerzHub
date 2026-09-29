import { MapContainer, Marker, Popup } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";

import type { Tables } from "@/types/supabase.types";
import { BasketballMapLayer } from "./BasketballMapLayer";
import { courtPinIcon } from "./courtPinIcon";

type Court = Tables<"courts">;

interface CourtLocationMapProps {
  court: Court;
}

function CourtLocationMap({ court }: CourtLocationMapProps) {
  const position: LatLngExpression = [court.latitude, court.longitude];

  return (
    <div className="h-64 w-full overflow-hidden rounded-xl border">
      <MapContainer
        center={position}
        zoom={16}
        scrollWheelZoom={false}
        className="h-full w-full"
        style={{ zIndex: 0 }}
        zoomControl={false}
      >
        <BasketballMapLayer />

        <Marker position={position} icon={courtPinIcon}>
          <Popup>{court.name}</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}

export default CourtLocationMap;

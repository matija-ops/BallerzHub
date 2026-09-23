import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";

import type { Tables } from "@/types/supabase.types";

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
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker position={position}>
          <Popup>{court.name}</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}

export default CourtLocationMap;

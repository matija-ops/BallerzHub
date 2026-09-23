import { useEffect, useState } from "react";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";

import type { Tables } from "@/types/supabase.types";

import { CourtLocationButton } from "./CourtLocationButton";
import { CourtMarker } from "./CourtMarker";
import { CourtMapController } from "./CourtMapController";

type Court = Tables<"courts">;

type MapLocation = [number, number];

interface CourtMapProps {
  courts: Court[];
  selectedCourt: Court | null;
  searchLocation: MapLocation | null;
  isSearching: boolean;
  onSelectCourt: (court: Court) => void;

  isSelectingLocation?: boolean;
  selectedLocation?: MapLocation | null;
  onSelectLocation?: (location: MapLocation) => void;
}

const DEFAULT_CENTER: LatLngExpression = [51.1657, 10.4515];
const DEFAULT_ZOOM = 6;

function LocationController({ location }: { location: MapLocation | null }) {
  const map = useMap();

  useEffect(() => {
    if (!location) {
      return;
    }

    map.flyTo(location, 15, {
      duration: 0.8,
    });
  }, [map, location]);

  return null;
}

function LocationSelectionController({
  isSelectingLocation,
  onSelectLocation,
}: {
  isSelectingLocation: boolean;
  onSelectLocation?: (location: MapLocation) => void;
}) {
  useMapEvents({
    click(event) {
      if (!isSelectingLocation || !onSelectLocation) {
        return;
      }

      onSelectLocation([event.latlng.lat, event.latlng.lng]);
    },
  });

  return null;
}

export function CourtMap({
  courts,
  selectedCourt,
  searchLocation,
  isSearching,
  onSelectCourt,
  isSelectingLocation = false,
  selectedLocation = null,
  onSelectLocation,
}: CourtMapProps) {
  const [userLocation, setUserLocation] = useState<MapLocation | null>(null);

  const [isLocating, setIsLocating] = useState(false);

  const handleLocate = () => {
    if (!navigator.geolocation) {
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation([position.coords.latitude, position.coords.longitude]);

        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
      }
    );
  };

  const validCourts = courts.filter(
    (court) =>
      Number.isFinite(court.latitude) && Number.isFinite(court.longitude)
  );

  return (
    <div className="relative h-full w-full overflow-hidden">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom={!isSelectingLocation}
        className="h-full w-full"
        style={{ zIndex: 0 }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <CourtMapController selectedCourt={selectedCourt} />

        <LocationController location={userLocation} />

        <LocationController location={searchLocation} />

        <LocationSelectionController
          isSelectingLocation={isSelectingLocation}
          onSelectLocation={onSelectLocation}
        />

        {validCourts.map((court) => (
          <CourtMarker key={court.id} court={court} onSelect={onSelectCourt} />
        ))}

        {userLocation && <Marker position={userLocation} />}

        {selectedLocation && <Marker position={selectedLocation} />}
      </MapContainer>

      <div className="pointer-events-none absolute right-4 bottom-28 z-[1000]">
        <div className="pointer-events-auto">
          <CourtLocationButton
            onLocate={handleLocate}
            isLocating={isLocating}
          />
        </div>

        {isSearching && (
          <div className="pointer-events-auto mt-2 rounded-md bg-white px-3 py-2 text-sm shadow-md">
            Ort wird gesucht …
          </div>
        )}
      </div>

      {isSelectingLocation && (
        <div className="pointer-events-none absolute top-20 left-1/2 z-[1000] -translate-x-1/2">
          <div className="rounded-xl bg-white px-4 py-3 text-sm font-medium shadow-lg">
            Klicke auf die Karte, um den Court-Standort auszuwählen.
          </div>
        </div>
      )}
    </div>
  );
}

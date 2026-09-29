import { useEffect, useState } from "react";
import { MapContainer, Marker, useMap, useMapEvents } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";

import type { Tables } from "@/types/supabase.types";

import { CourtLocationButton } from "./CourtLocationButton";
import { CourtMarker } from "./CourtMarker";
import { CourtMapController } from "./CourtMapController";
import { BasketballMapLayer } from "./BasketballMapLayer";

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
const COURT_MARKER_MIN_ZOOM = 9;

function CourtMarkers({
  courts,
  onSelectCourt,
}: {
  courts: Court[];
  onSelectCourt: (court: Court) => void;
}) {
  const map = useMap();
  const [areMarkersVisible, setAreMarkersVisible] = useState(
    () => map.getZoom() >= COURT_MARKER_MIN_ZOOM
  );

  useMapEvents({
    zoomend() {
      setAreMarkersVisible(map.getZoom() >= COURT_MARKER_MIN_ZOOM);
    },
  });

  if (!areMarkersVisible) {
    return null;
  }

  return courts.map((court) => (
    <CourtMarker key={court.id} court={court} onSelect={onSelectCourt} />
  ));
}

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

      const location = event.latlng.wrap();
      onSelectLocation([location.lat, location.lng]);
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
  const [locationError, setLocationError] = useState<string | null>(null);

  const handleLocate = () => {
    if (!navigator.geolocation) {
      setLocationError(
        "Dein Browser unterstützt die Standortbestimmung nicht."
      );
      return;
    }

    if (!window.isSecureContext) {
      setLocationError(
        "Der Standort ist nur über eine sichere HTTPS-Verbindung verfügbar."
      );
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation([position.coords.latitude, position.coords.longitude]);

        setIsLocating(false);
      },
      (geolocationError) => {
        const errorMessages: Record<number, string> = {
          [geolocationError.PERMISSION_DENIED]:
            "Bitte erlaube den Standortzugriff in den Browser-Einstellungen.",
          [geolocationError.POSITION_UNAVAILABLE]:
            "Dein Standort konnte gerade nicht ermittelt werden.",
          [geolocationError.TIMEOUT]:
            "Die Standortbestimmung dauert zu lange. Bitte versuche es erneut.",
        };

        setLocationError(
          errorMessages[geolocationError.code] ??
            "Der Standort konnte nicht ermittelt werden."
        );
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15_000,
        maximumAge: 60_000,
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
        minZoom={1}
        maxBounds={[
          [-85, -180],
          [85, 180],
        ]}
      >
        <BasketballMapLayer />

        <CourtMapController selectedCourt={selectedCourt} />

        <LocationController location={userLocation} />

        <LocationController location={searchLocation} />

        <LocationSelectionController
          isSelectingLocation={isSelectingLocation}
          onSelectLocation={onSelectLocation}
        />

        <CourtMarkers courts={validCourts} onSelectCourt={onSelectCourt} />

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

        {locationError && (
          <div
            className="text-destructive-foreground pointer-events-auto mt-2 max-w-64 rounded-md bg-destructive px-3 py-2 text-sm shadow-md"
            role="alert"
          >
            {locationError}
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

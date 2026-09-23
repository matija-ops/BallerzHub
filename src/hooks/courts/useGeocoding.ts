import { useCallback, useState } from "react";

type SearchLocation = [number, number];

interface NominatimResult {
  lat: string;
  lon: string;
}

export function useGeocoding() {
  const [searchLocation, setSearchLocation] = useState<SearchLocation | null>(
    null
  );

  const [isSearching, setIsSearching] = useState(false);

  const search = useCallback(async (query: string) => {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      return;
    }

    setIsSearching(true);

    try {
      const url = new URL("https://nominatim.openstreetmap.org/search");

      url.searchParams.set("q", trimmedQuery);
      url.searchParams.set("format", "json");
      url.searchParams.set("limit", "1");
      url.searchParams.set("countrycodes", "de");

      const response = await fetch(url.toString(), {
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Der Ort konnte nicht gesucht werden.");
      }

      const results = (await response.json()) as NominatimResult[];

      if (results.length === 0) {
        setSearchLocation(null);
        return;
      }

      const latitude = Number(results[0].lat);
      const longitude = Number(results[0].lon);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        setSearchLocation(null);
        return;
      }

      setSearchLocation([latitude, longitude]);
    } catch (error) {
      console.error("Geocoding fehlgeschlagen:", error);
      setSearchLocation(null);
    } finally {
      setIsSearching(false);
    }
  }, []);

  return {
    searchLocation,
    isSearching,
    search,
  };
}

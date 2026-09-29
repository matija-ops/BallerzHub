import { useEffect, useState } from "react";
import { useMap } from "react-leaflet";
import { maplibreGL } from "@maplibre/maplibre-gl-leaflet";
import { setWorkerUrl } from "maplibre-gl";

import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";

import "maplibre-gl/dist/maplibre-gl.css";

setWorkerUrl(workerUrl);

const MAP_STYLES = {
  dark: "/map/basketball-dark.json",
  light: "/map/basketball-light.json",
} as const;

function getResolvedTheme(): keyof typeof MAP_STYLES {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function BasketballMapLayer() {
  const map = useMap();
  const [resolvedTheme, setResolvedTheme] = useState(getResolvedTheme);

  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => {
      setResolvedTheme(getResolvedTheme());
    });

    observer.observe(root, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const layer = maplibreGL({
      style: MAP_STYLES[resolvedTheme],
    });

    layer.addTo(map);

    return () => {
      if (map.hasLayer(layer)) {
        map.removeLayer(layer);
      }
    };
  }, [map, resolvedTheme]);

  return null;
}

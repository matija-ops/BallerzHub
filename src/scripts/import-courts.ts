import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { v5 as uuidv5 } from "uuid";
import * as XLSX from "xlsx";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY müssen gesetzt sein."
  );
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * ---------------------------------------------------------
 * KONFIGURATION
 * ---------------------------------------------------------
 */

const MIN_POPULATION = Number(process.env.MIN_POPULATION ?? "50000");

const MUNICIPALITIES_FILE =
  process.env.MUNICIPALITIES_FILE ?? "data/gemeinden.xlsx";

const OVERPASS_URL =
  process.env.OVERPASS_URL ?? "https://overpass-api.de/api/interpreter";

const OSM_MAX_RETRIES = Number(process.env.OSM_MAX_RETRIES ?? "3");

const OSM_RETRY_DELAY_MS = Number(process.env.OSM_RETRY_DELAY_MS ?? "5000");

const CITY_DELAY_MS = Number(process.env.CITY_DELAY_MS ?? "3000");

const IMPORT_BATCH_SIZE = 100;

const UUID_NAMESPACE = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";

/**
 * Für Tests kann die Anzahl der Städte begrenzt werden:
 *
 * TEST_CITY_LIMIT=5
 *
 * Leer/0 = alle Städte.
 */
const TEST_CITY_LIMIT = Number(process.env.TEST_CITY_LIMIT ?? "0");

/**
 * ---------------------------------------------------------
 * TYPEN
 * ---------------------------------------------------------
 */

type City = {
  name: string;
  population: number;
  ags?: string;
};

type Municipality = {
  id: string;
  name: string;
};

type CourtInsert = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  type: string;
  hoops_count: number;
  has_lightning: boolean;
  is_accessible: boolean;
  status: string;
  municipality_id: string;
};

type ExistingCourt = CourtInsert;

type OSMElement = {
  type: "node" | "way" | "relation";
  id: number;

  lat?: number;
  lon?: number;

  center?: {
    lat: number;
    lon: number;
  };

  tags?: Record<string, string>;
};

type OverpassResponse = {
  elements?: OSMElement[];
};

/**
 * ---------------------------------------------------------
 * HILFSFUNKTIONEN
 * ---------------------------------------------------------
 */

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeName(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function escapeOverpassString(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function distanceInMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const earthRadius = 6_371_000;

  const toRadians = (value: number) => (value * Math.PI) / 180;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return 2 * earthRadius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * ---------------------------------------------------------
 * GEMEINDEN AUS XLSX
 * ---------------------------------------------------------
 */

function findColumn(keys: string[], patterns: RegExp[]) {
  return keys.find((key) => patterns.some((pattern) => pattern.test(key)));
}

function parsePopulation(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.round(value);
  }

  if (typeof value !== "string") {
    return null;
  }

  const cleaned = value
    .trim()
    .replace(/\./g, "")
    .replace(/\s/g, "")
    .replace(/,/g, ".");

  const number = Number(cleaned);

  if (!Number.isFinite(number)) {
    return null;
  }

  return Math.round(number);
}

function normalizeAgs(value: unknown) {
  if (value === null || value === undefined) {
    return undefined;
  }

  const text = String(value).trim();

  if (!text) {
    return undefined;
  }

  /**
   * AGS sollte 8-stellig sein.
   * Excel kann führende Nullen entfernen.
   */
  if (/^\d+$/.test(text)) {
    return text.padStart(8, "0");
  }

  return text;
}

async function loadCities(): Promise<City[]> {
  console.log("");
  console.log("Lade Gemeindeverzeichnis...");

  console.log(`Datei: ${MUNICIPALITIES_FILE}`);

  const workbook = XLSX.readFile(MUNICIPALITIES_FILE);

  if (workbook.SheetNames.length === 0) {
    throw new Error("Die XLSX-Datei enthält keine Tabellenblätter.");
  }

  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: null,
  });

  if (rows.length === 0) {
    throw new Error("Die XLSX-Datei enthält keine Daten.");
  }

  const keys = Object.keys(rows[0]);

  console.log(`Erkannte Spalten: ${keys.join(", ")}`);

  /**
   * Wir versuchen unterschiedliche mögliche
   * Bezeichnungen der Destatis-Datei zu erkennen.
   */

  const nameColumn = findColumn(keys, [
    /gemeindename/i,
    /gemeinde.*name/i,
    /name.*gemeinde/i,
    /^gemeinde$/i,
    /stadt.*name/i,
    /bezeichnung/i,
  ]);

  const populationColumn = findColumn(keys, [
    /bevölkerung/i,
    /bevoelkerung/i,
    /einwohner/i,
    /population/i,
  ]);

  const agsColumn = findColumn(keys, [
    /^ags$/i,
    /gemeindeschlüssel/i,
    /gemeindeschluessel/i,
    /amtlicher.*gemeindeschlüssel/i,
    /amtlicher.*gemeindeschluessel/i,
  ]);

  if (!nameColumn) {
    throw new Error(
      "Gemeindename konnte nicht erkannt werden.\n\n" +
        "Gefundene Spalten:\n" +
        keys.join("\n")
    );
  }

  if (!populationColumn) {
    throw new Error(
      "Einwohner-Spalte konnte nicht erkannt werden.\n\n" +
        "Gefundene Spalten:\n" +
        keys.join("\n")
    );
  }

  console.log(`Gemeindename: ${nameColumn}`);

  console.log(`Einwohner: ${populationColumn}`);

  if (agsColumn) {
    console.log(`AGS: ${agsColumn}`);
  } else {
    console.warn("Kein AGS gefunden. Der Import funktioniert trotzdem.");
  }

  const cities: City[] = [];

  for (const row of rows) {
    const name = String(row[nameColumn] ?? "").trim();

    if (!name) {
      continue;
    }

    const population = parsePopulation(row[populationColumn]);

    if (population === null || population < MIN_POPULATION) {
      continue;
    }

    cities.push({
      name,
      population,
      ags: agsColumn ? normalizeAgs(row[agsColumn]) : undefined,
    });
  }

  /**
   * Doppelte Gemeinden entfernen.
   */
  const uniqueCities = Array.from(
    new Map(
      cities.map((city) => [city.ags ?? normalizeName(city.name), city])
    ).values()
  );

  /**
   * Größte Städte zuerst.
   */
  uniqueCities.sort((a, b) => b.population - a.population);

  console.log(
    `Gemeinden >= ${MIN_POPULATION.toLocaleString(
      "de-DE"
    )}: ${uniqueCities.length}`
  );

  return TEST_CITY_LIMIT > 0
    ? uniqueCities.slice(0, TEST_CITY_LIMIT)
    : uniqueCities;
}

/**
 * ---------------------------------------------------------
 * MUNICIPALITY
 * ---------------------------------------------------------
 */

async function getOrCreateMunicipality(city: City): Promise<Municipality> {
  /**
   * Zuerst exakt nach Namen suchen.
   */
  const { data: existing, error } = await supabase
    .from("municipalities")
    .select("id,name")
    .eq("name", city.name)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Municipality ${city.name} konnte nicht gelesen werden: ${error.message}`
    );
  }

  if (existing) {
    console.log(`Municipality vorhanden: ${city.name}`);

    return existing;
  }

  /**
   * Noch nicht vorhanden -> erstellen.
   */
  const { data: created, error: insertError } = await supabase
    .from("municipalities")
    .insert({
      name: city.name,
    })
    .select("id,name")
    .single();

  if (insertError) {
    throw new Error(
      `Municipality ${city.name} konnte nicht erstellt werden: ${insertError.message}`
    );
  }

  console.log(`Municipality erstellt: ${city.name}`);

  return created;
}

/**
 * ---------------------------------------------------------
 * OVERPASS
 * ---------------------------------------------------------
 */

async function requestOverpass(
  query: string,
  attempt = 1
): Promise<OverpassResponse> {
  try {
    const response = await fetch(OVERPASS_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",

        "Content-Type": "application/x-www-form-urlencoded",

        "User-Agent": "BasketballPlattform/1.0 OSM import",
      },

      body: `data=${encodeURIComponent(query)}`,
    });

    console.log(`OSM Response: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const body = await response.text();

      throw new Error(
        `Overpass antwortete mit ${response.status}: ${body.slice(0, 300)}`
      );
    }

    return (await response.json()) as OverpassResponse;
  } catch (error) {
    if (attempt >= OSM_MAX_RETRIES) {
      throw error;
    }

    const delay = OSM_RETRY_DELAY_MS * attempt;

    console.warn(
      `Overpass Request fehlgeschlagen ` +
        `(Versuch ${attempt}/${OSM_MAX_RETRIES}). ` +
        `Retry in ${delay}ms...`
    );

    await sleep(delay);

    return requestOverpass(query, attempt + 1);
  }
}

/**
 * ---------------------------------------------------------
 * OSM GEMEINDEGRENZE
 * ---------------------------------------------------------
 */

async function findCityBoundary(city: City) {
  /**
   * admin_level=8 entspricht bei deutschen
   * Kommunen grundsätzlich der Gemeindeebene.
   *
   * Zusätzlich schränken wir auf Deutschland ein,
   * damit gleichnamige Orte in anderen Ländern
   * nicht gefunden werden.
   */

  const escapedName = escapeOverpassString(city.name);

  const query = `
[out:json][timeout:60];

area
  ["ISO3166-1"="DE"]
  ["boundary"="administrative"]
  ["admin_level"="2"]
  ->.germany;

rel
  ["boundary"="administrative"]
  ["admin_level"="8"]
  ["name"="${escapedName}"]
  (area.germany);

out ids tags;
`;

  const result = await requestOverpass(query);

  const relations = result.elements ?? [];

  if (relations.length === 0) {
    return null;
  }

  /**
   * Bei mehreren Treffern versuchen wir,
   * anhand des Namens exakt zu matchen.
   */
  const exact = relations.find((relation) => relation.tags?.name === city.name);

  return exact ?? relations[0];
}

/**
 * ---------------------------------------------------------
 * OSM COURTS EINER STADT
 * ---------------------------------------------------------
 */

function getElementCoordinates(element: OSMElement) {
  if (
    element.type === "node" &&
    element.lat !== undefined &&
    element.lon !== undefined
  ) {
    return {
      latitude: element.lat,
      longitude: element.lon,
    };
  }

  if (element.center) {
    return {
      latitude: element.center.lat,
      longitude: element.center.lon,
    };
  }

  return null;
}

function mapOsmElementToCourt(
  element: OSMElement,
  municipalityId: string
): CourtInsert | null {
  const coordinates = getElementCoordinates(element);

  if (!coordinates) {
    return null;
  }

  const tags = element.tags ?? {};

  const name =
    tags.name?.trim() ||
    tags["name:de"]?.trim() ||
    `Basketballcourt ${element.id}`;

  /**
   * Achtung:
   *
   * Wenn OSM "hoops" nicht kennt, verwenden wir
   * weiterhin 1 als Fallback, wie in deinem
   * bisherigen Importer.
   */
  const parsedHoops = Number.parseInt(tags.hoops ?? "1", 10);

  const hoopsCount =
    Number.isFinite(parsedHoops) && parsedHoops > 0 ? parsedHoops : 1;

  const isIndoor = tags.indoor === "yes" || tags.covered === "yes";

  const hasLightning = tags.lit === "yes";

  const isAccessible = tags.wheelchair === "yes";

  return {
    id: uuidv5(`osm:${element.type}:${element.id}`, UUID_NAMESPACE),

    name,

    latitude: coordinates.latitude,

    longitude: coordinates.longitude,

    type: isIndoor ? "indoor" : "outdoor",

    hoops_count: hoopsCount,

    has_lightning: hasLightning,

    is_accessible: isAccessible,

    status: "active",

    municipality_id: municipalityId,
  };
}

async function fetchOsmCourtsForCity(city: City, municipalityId: string) {
  console.log("");
  console.log("----------------------------------------");

  console.log(`OSM: ${city.name}`);

  console.log(`Einwohner: ${city.population.toLocaleString("de-DE")}`);

  if (city.ags) {
    console.log(`AGS: ${city.ags}`);
  }

  console.log("Suche OSM-Gemeindegrenze...");

  const boundary = await findCityBoundary(city);

  if (!boundary) {
    console.warn(`Keine OSM-Gemeindegrenze für ${city.name} gefunden.`);

    return [];
  }

  console.log(`OSM Boundary gefunden: Relation ${boundary.id}`);

  /**
   * Relation-ID -> OSM Area-ID
   *
   * Für Relationen:
   * 3600000000 + relation id
   */
  const areaId = 3600000000 + boundary.id;

  const query = `
[out:json][timeout:120];

area(${areaId})->.city;

(
  node["sport"="basketball"](area.city);
  way["sport"="basketball"](area.city);
  relation["sport"="basketball"](area.city);
);

out center tags;
`;

  const result = await requestOverpass(query);

  const elements = result.elements ?? [];

  console.log(`OSM Elemente gefunden: ${elements.length}`);

  const courts: CourtInsert[] = [];

  for (const element of elements) {
    const court = mapOsmElementToCourt(element, municipalityId);

    if (court) {
      courts.push(court);
    }
  }

  return courts;
}

/**
 * ---------------------------------------------------------
 * DUPLIKATE
 * ---------------------------------------------------------
 */

function isSameCourt(
  a: CourtInsert | ExistingCourt,
  b: CourtInsert | ExistingCourt
) {
  const distance = distanceInMeters(
    a.latitude,
    a.longitude,
    b.latitude,
    b.longitude
  );

  /**
   * Gleiche Position:
   * maximal 50 Meter.
   */
  if (distance <= 50) {
    return true;
  }

  const sameName = normalizeName(a.name) === normalizeName(b.name);

  /**
   * Gleicher Name:
   * maximal 150 Meter.
   */
  return sameName && distance <= 150;
}

function deduplicateCourts(courts: CourtInsert[]) {
  const result: CourtInsert[] = [];

  for (const court of courts) {
    const duplicate = result.some((existing) => isSameCourt(existing, court));

    if (!duplicate) {
      result.push(court);
    }
  }

  return result;
}

/**
 * ---------------------------------------------------------
 * BESTEHENDE COURTS
 * ---------------------------------------------------------
 */

async function loadExistingCourts() {
  const { data, error } = await supabase
    .from("courts")
    .select(
      [
        "id",
        "name",
        "latitude",
        "longitude",
        "type",
        "hoops_count",
        "has_lightning",
        "is_accessible",
        "status",
        "municipality_id",
      ].join(",")
    );

  if (error) {
    throw new Error(
      `Bestehende Courts konnten nicht geladen werden: ${error.message}`
    );
  }

  return (data ?? []) as ExistingCourt[];
}

/**
 * ---------------------------------------------------------
 * IMPORT
 * ---------------------------------------------------------
 */

async function importCourts(courts: CourtInsert[]) {
  let imported = 0;

  for (let i = 0; i < courts.length; i += IMPORT_BATCH_SIZE) {
    const batch = courts.slice(i, i + IMPORT_BATCH_SIZE);

    const { error } = await supabase.from("courts").upsert(batch, {
      onConflict: "id",
    });

    if (error) {
      throw new Error(`Import-Batch fehlgeschlagen: ${error.message}`);
    }

    imported += batch.length;

    console.log(`Importiert: ${imported}/${courts.length}`);
  }

  return imported;
}

/**
 * ---------------------------------------------------------
 * MAIN
 * ---------------------------------------------------------
 */

async function main() {
  console.log("");
  console.log("==============================================");
  console.log("Basketballplattform");
  console.log("Deutschland Court Import");
  console.log("==============================================");

  console.log(`Mindestbevölkerung: ${MIN_POPULATION.toLocaleString("de-DE")}`);

  console.log(`Gemeindeverzeichnis: ${MUNICIPALITIES_FILE}`);

  console.log(`Overpass: ${OVERPASS_URL}`);

  if (TEST_CITY_LIMIT > 0) {
    console.log(`TEST-MODUS: maximal ${TEST_CITY_LIMIT} Städte`);
  }

  /**
   * -------------------------------------------------------
   * Städte laden
   * -------------------------------------------------------
   */

  const cities = await loadCities();

  if (cities.length === 0) {
    throw new Error(
      "Keine Gemeinden ab der angegebenen Einwohnergrenze gefunden."
    );
  }

  /**
   * -------------------------------------------------------
   * Bestehende Courts EINMAL laden
   * -------------------------------------------------------
   *
   * Nicht für jede Stadt erneut die komplette Tabelle
   * abfragen.
   */

  const existingCourts = await loadExistingCourts();

  console.log("");
  console.log(`Bereits vorhandene Courts: ${existingCourts.length}`);

  /**
   * -------------------------------------------------------
   * Statistiken
   * -------------------------------------------------------
   */

  let processedCities = 0;
  let successfulCities = 0;
  let failedCities = 0;

  let totalFound = 0;
  let totalNew = 0;
  let totalImported = 0;

  /**
   * -------------------------------------------------------
   * Städte abarbeiten
   * -------------------------------------------------------
   */

  for (let index = 0; index < cities.length; index++) {
    const city = cities[index];

    console.log("");
    console.log(`########################################`);

    console.log(`Stadt ${index + 1}/${cities.length}`);

    console.log(`${city.name} (${city.population.toLocaleString("de-DE")})`);

    console.log(`########################################`);

    try {
      /**
       * Municipality sicherstellen.
       */
      const municipality = await getOrCreateMunicipality(city);

      /**
       * OSM Courts holen.
       */
      let courts = await fetchOsmCourtsForCity(city, municipality.id);

      totalFound += courts.length;

      console.log(`Courts vor Duplikatbereinigung: ${courts.length}`);

      /**
       * Duplikate innerhalb des aktuellen
       * Stadtimports entfernen.
       */
      courts = deduplicateCourts(courts);

      console.log(`Courts nach Duplikatbereinigung: ${courts.length}`);

      /**
       * Gegen bereits importierte Courts prüfen.
       */
      const newCourts = courts.filter(
        (court) =>
          !existingCourts.some((existing) => isSameCourt(existing, court))
      );

      console.log(`Neue Courts: ${newCourts.length}`);

      totalNew += newCourts.length;

      /**
       * Neue Courts importieren.
       */
      if (newCourts.length > 0) {
        const imported = await importCourts(newCourts);

        totalImported += imported;

        /**
         * Wichtig:
         * Neu importierte Courts sofort zum lokalen
         * Cache hinzufügen, damit sie bei späteren
         * Städten berücksichtigt werden.
         */
        existingCourts.push(...newCourts);
      }

      successfulCities++;
    } catch (error) {
      failedCities++;

      console.error("");
      console.error(`FEHLER bei ${city.name}`);

      console.error(error);

      console.error("Import wird mit der nächsten Stadt fortgesetzt.");
    }

    processedCities++;

    /**
     * Overpass nicht mit Anfragen bombardieren.
     */
    if (index < cities.length - 1) {
      await sleep(CITY_DELAY_MS);
    }
  }

  /**
   * -------------------------------------------------------
   * ABSCHLUSS
   * -------------------------------------------------------
   */

  console.log("");
  console.log("==============================================");
  console.log("IMPORT ABGESCHLOSSEN");
  console.log("==============================================");

  console.log(`Gemeinden insgesamt: ${cities.length}`);

  console.log(`Gemeinden verarbeitet: ${processedCities}`);

  console.log(`Erfolgreiche Gemeinden: ${successfulCities}`);

  console.log(`Fehlgeschlagene Gemeinden: ${failedCities}`);

  console.log(`OSM Courts gefunden: ${totalFound}`);

  console.log(`Neue Courts: ${totalNew}`);

  console.log(`Importierte Courts: ${totalImported}`);

  console.log("==============================================");
}

main().catch((error) => {
  console.error("");
  console.error("Globaler Importfehler:");
  console.error(error);

  process.exit(1);
});

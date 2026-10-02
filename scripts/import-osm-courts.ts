import "dotenv/config";
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";
import type { Database, TablesInsert } from "../src/types/supabase.types";
import { chain } from "stream-chain";
import { parser } from "stream-json";
import { pick } from "stream-json/filters/pick.js";
import { streamArray } from "stream-json/streamers/stream-array.js";

// --------------------------------------------------
// Configuration
// --------------------------------------------------

const INPUT_FILE = process.argv[2] ?? "sport.geojson";

const BATCH_SIZE = 500;

// true = Daten analysieren, aber NICHT in Supabase schreiben.
// Für den ersten Lauf unbedingt true lassen.
const DRY_RUN = false;

// --------------------------------------------------
// Supabase
// --------------------------------------------------

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("SUPABASE_URL fehlt.");
}

if (!supabaseServiceRoleKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY fehlt.");
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// --------------------------------------------------
// Types
// --------------------------------------------------

type CourtInsert = TablesInsert<"courts">;

type OsmProperties = Record<string, unknown>;

interface GeoJsonFeature {
  type: "Feature";
  properties?: OsmProperties | null;
  geometry?: GeoJsonGeometry | null;
}

type Position = [number, number];

type GeoJsonGeometry =
  | {
      type: "Point";
      coordinates: Position;
    }
  | {
      type: "Polygon";
      coordinates: Position[][];
    }
  | {
      type: "MultiPolygon";
      coordinates: Position[][][];
    }
  | {
      type: string;
      coordinates?: unknown;
    };

interface Municipality {
  id: string;
  name: string;
}

interface ImportStats {
  features: number;
  basketball: number;
  privateSkipped: number;
  invalidGeometry: number;
  imported: number;
  failed: number;
  withoutMunicipality: number;
  fallbackName: number;
  unknownHoops: number;
}

// --------------------------------------------------
// Statistics
// --------------------------------------------------

const stats: ImportStats = {
  features: 0,
  basketball: 0,
  privateSkipped: 0,
  invalidGeometry: 0,
  imported: 0,
  failed: 0,
  withoutMunicipality: 0,
  fallbackName: 0,
  unknownHoops: 0,
};

// --------------------------------------------------
// Municipality lookup
// --------------------------------------------------

async function loadMunicipalities(): Promise<Map<string, Municipality>> {
  const lookup = new Map<string, Municipality>();
  const pageSize = 1_000;

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("municipalities")
      .select("id, name")
      .range(from, from + pageSize - 1);

    if (error) {
      throw new Error(
        `Municipalities konnten nicht geladen werden: ${error.message}`
      );
    }

    for (const municipality of data ?? []) {
      lookup.set(normalizeName(municipality.name), municipality);
    }

    if (!data || data.length < pageSize) {
      break;
    }
  }

  console.log(`${lookup.size} Municipalities geladen.`);

  return lookup;
}

function normalizeName(value: string): string {
  return value
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase("de-DE")
    .replace(/\s+/g, " ");
}

// --------------------------------------------------
// OSM helpers
// --------------------------------------------------

function getString(properties: OsmProperties, key: string): string | undefined {
  const value = properties[key];

  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : undefined;
}

function containsBasketball(properties: OsmProperties): boolean {
  const sport = getString(properties, "sport");

  if (!sport) {
    return false;
  }

  return sport
    .toLowerCase()
    .split(";")
    .map((item) => item.trim())
    .includes("basketball");
}

function isPrivate(properties: OsmProperties): boolean {
  return getString(properties, "access")?.toLowerCase() === "private";
}

// --------------------------------------------------
// Court mapping
// --------------------------------------------------

function getCourtName(properties: OsmProperties): string {
  const name = getString(properties, "name");

  if (name) {
    return name;
  }

  stats.fallbackName++;

  return "Basketballplatz";
}

function getCourtType(properties: OsmProperties): string {
  const indoor = getString(properties, "indoor")?.toLowerCase();

  return indoor === "yes" ? "indoor" : "outdoor";
}

function getHoopsCount(properties: OsmProperties): number {
  const hoops = getString(properties, "hoops");

  if (!hoops) {
    stats.unknownHoops++;
    return 0;
  }

  const parsed = Number.parseInt(hoops, 10);

  if (!Number.isInteger(parsed) || parsed < 0) {
    stats.unknownHoops++;
    return 0;
  }

  return parsed;
}

function getLighting(properties: OsmProperties): boolean {
  return parseOsmBoolean(getString(properties, "lit"));
}

function getAccessibility(properties: OsmProperties): boolean {
  return parseOsmBoolean(getString(properties, "wheelchair"));
}

function parseOsmBoolean(value?: string): boolean {
  if (!value) {
    return false;
  }

  return ["yes", "true", "1"].includes(value.toLowerCase());
}

// --------------------------------------------------
// Municipality
// --------------------------------------------------

function getMunicipalityId(
  properties: OsmProperties,
  municipalities: Map<string, Municipality>
): string | null {
  const city = getString(properties, "addr:city");

  if (!city) {
    stats.withoutMunicipality++;
    return null;
  }

  const municipality = municipalities.get(normalizeName(city));

  if (!municipality) {
    stats.withoutMunicipality++;
    return null;
  }

  return municipality.id;
}

// --------------------------------------------------
// Geometry
// --------------------------------------------------

function getCoordinates(
  geometry: GeoJsonGeometry | null | undefined
): Position | null {
  if (!geometry) {
    return null;
  }

  if (geometry.type === "Point") {
    const [longitude, latitude] = geometry.coordinates as Position;

    return validCoordinates(longitude, latitude) ? [longitude, latitude] : null;
  }

  if (geometry.type === "Polygon") {
    const coordinates = geometry.coordinates as Position[][];

    return representativePoint(coordinates[0]);
  }

  if (geometry.type === "MultiPolygon") {
    const polygons = geometry.coordinates as Position[][][];

    if (polygons.length === 0) {
      return null;
    }

    // Für den Import reicht zunächst das Polygon
    // mit dem größten äußeren Ring.
    const largestPolygon = polygons.reduce((largest, polygon) => {
      return polygon[0]?.length > largest[0]?.length ? polygon : largest;
    });

    return representativePoint(largestPolygon[0]);
  }

  return null;
}

function representativePoint(
  coordinates: Position[] | undefined
): Position | null {
  if (!coordinates || coordinates.length === 0) {
    return null;
  }

  let longitudeSum = 0;
  let latitudeSum = 0;
  let validPoints = 0;

  for (const coordinate of coordinates) {
    const [longitude, latitude] = coordinate;

    if (!validCoordinates(longitude, latitude)) {
      continue;
    }

    longitudeSum += longitude;
    latitudeSum += latitude;
    validPoints++;
  }

  if (validPoints === 0) {
    return null;
  }

  return [longitudeSum / validPoints, latitudeSum / validPoints];
}

function validCoordinates(longitude: number, latitude: number): boolean {
  return (
    Number.isFinite(longitude) &&
    Number.isFinite(latitude) &&
    longitude >= -180 &&
    longitude <= 180 &&
    latitude >= -90 &&
    latitude <= 90
  );
}

// --------------------------------------------------
// Feature -> Supabase Court
// --------------------------------------------------

function featureToCourt(
  feature: GeoJsonFeature,
  municipalities: Map<string, Municipality>
): CourtInsert | null {
  const properties = feature.properties ?? {};

  if (!containsBasketball(properties)) {
    return null;
  }

  stats.basketball++;

  if (isPrivate(properties)) {
    stats.privateSkipped++;
    return null;
  }

  const coordinates = getCoordinates(feature.geometry);

  if (!coordinates) {
    stats.invalidGeometry++;
    return null;
  }

  const [longitude, latitude] = coordinates;

  const court: CourtInsert = {
    name: getCourtName(properties),
    latitude,
    longitude,
    type: getCourtType(properties),
    hoops_count: getHoopsCount(properties),
    has_lightning: getLighting(properties),
    is_accessible: getAccessibility(properties),
    status: "active",
    municipality_id: getMunicipalityId(properties, municipalities),
  };

  return court;
}

// --------------------------------------------------
// Supabase insert
// --------------------------------------------------

async function insertBatch(batch: CourtInsert[]): Promise<void> {
  if (batch.length === 0) {
    return;
  }

  if (DRY_RUN) {
    stats.imported += batch.length;

    console.log(`[DRY RUN] ${batch.length} Courts würden importiert.`);

    return;
  }

  const { error } = await supabase.from("courts").insert(batch);

  if (error) {
    stats.failed += batch.length;

    console.error("Batch fehlgeschlagen:");
    console.error(error);

    return;
  }

  stats.imported += batch.length;

  console.log(`${stats.imported} Courts importiert ...`);
}

// --------------------------------------------------
// Import
// --------------------------------------------------

async function importCourts(): Promise<void> {
  if (!fs.existsSync(INPUT_FILE)) {
    throw new Error(`GeoJSON-Datei nicht gefunden: ${INPUT_FILE}`);
  }

  console.log("Basketball-Court-Import");
  console.log("-----------------------");
  console.log(`Datei: ${INPUT_FILE}`);
  console.log(`Dry Run: ${DRY_RUN ? "JA" : "NEIN"}`);
  console.log("");

  const municipalities = await loadMunicipalities();

  const pipeline = chain([
    fs.createReadStream(INPUT_FILE),
    parser(),
    pick({
      filter: "features",
    }),
    streamArray(),
  ]);

  let batch: CourtInsert[] = [];

  for await (const item of pipeline) {
    stats.features++;

    const feature = item.value as GeoJsonFeature;

    const court = featureToCourt(feature, municipalities);

    if (!court) {
      continue;
    }

    batch.push(court);

    if (batch.length >= BATCH_SIZE) {
      await insertBatch(batch);
      batch = [];
    }

    if (stats.features % 100_000 === 0) {
      console.log(
        `${stats.features.toLocaleString("de-DE")} Features verarbeitet ...`
      );
    }
  }

  await insertBatch(batch);

  printStats();
}

// --------------------------------------------------
// Result
// --------------------------------------------------

function printStats(): void {
  console.log("");
  console.log("Import abgeschlossen");
  console.log("--------------------");

  console.table({
    "GeoJSON Features": stats.features,
    "Basketball Features": stats.basketball,
    "Private übersprungen": stats.privateSkipped,
    "Ungültige Geometrie": stats.invalidGeometry,
    "Fallback-Name": stats.fallbackName,
    "Korbanzahl unbekannt": stats.unknownHoops,
    "Ohne Municipality": stats.withoutMunicipality,
    "Importiert / gültig": stats.imported,
    "Insert fehlgeschlagen": stats.failed,
  });
}

importCourts().catch((error: unknown) => {
  console.error("");
  console.error("Import abgebrochen.");

  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(error);
  }

  process.exit(1);
});

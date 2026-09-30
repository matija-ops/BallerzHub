#!/usr/bin/env node

/** Synchronisiert basketball-bund.net Liga 54610 in Supabase. Node.js 18+. */
import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";

async function loadEnvLocal() {
  try {
    const content = await readFile(
      new URL("../.env.local", import.meta.url),
      "utf8"
    );
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const separator = trimmed.indexOf("=");
      if (separator < 1) continue;

      const key = trimmed.slice(0, separator).trim();
      let value = trimmed.slice(separator + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

await loadEnvLocal();

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const INTERNAL_LEAGUE_ID = "f88f2e61-9bb0-4e8f-9b5b-e563db6b0cbf";
const EXTERNAL_LEAGUE_ID = 55802;
const SOURCE = "basketball-bund.net";
const API_URL = `https://www.basketball-bund.net/rest/competition/actual/id/${EXTERNAL_LEAGUE_ID}`;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Es fehlen SUPABASE_URL/VITE_SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY."
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const fail = (message, error) => {
  if (error) console.error(message, error);
  throw new Error(message);
};

function parseResult(result) {
  if (!result || !/^\d+\s*:\s*\d+$/.test(result))
    return { home: null, away: null };
  const [home, away] = result.split(":").map(Number);
  return { home, away };
}

function apiTeam(team) {
  return team
    ? {
        seasonTeamId: team.seasonTeamId ?? null,
        teamCompetitionId: team.teamCompetitionId ?? null,
        teamPermanentId: team.teamPermanentId ?? null,
        name: team.teamname ?? "Unbekannt",
        clubId: team.clubId ?? null,
      }
    : null;
}

function normalizeTeamName(name) {
  return String(name ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

async function fetchSource() {
  const response = await fetch(API_URL, {
    headers: { accept: "application/json, text/plain, */*" },
  });
  if (!response.ok)
    throw new Error(`API HTTP ${response.status} ${response.statusText}`);
  const payload = await response.json();
  if (payload.status && payload.status !== "0")
    throw new Error(payload.message || `API-Status ${payload.status}`);
  return payload.data;
}

async function syncLeague(data) {
  const liga = data.ligaData ?? {};
  const { error } = await supabase
    .from("leagues")
    .update({
      external_liga_id: EXTERNAL_LEAGUE_ID,
      external_season_id: liga.seasonId ?? null,
      external_source: SOURCE,
      external_synced_at: new Date().toISOString(),
    })
    .eq("id", INTERNAL_LEAGUE_ID);
  if (error) fail("Liga konnte nicht aktualisiert werden.", error);
  return liga;
}

async function loadExistingTeams() {
  const { data, error } = await supabase
    .from("teams")
    .select(
      "id, name, club_id, external_permanent_team_id, external_season_team_id, external_team_competition_id"
    )
    .eq("league_id", INTERNAL_LEAGUE_ID);
  if (error) fail("Teams konnten nicht geladen werden.", error);
  return new Map(
    (data ?? [])
      .filter((row) => row.external_permanent_team_id != null)
      .map((row) => [Number(row.external_permanent_team_id), row])
  );
}

async function loadClubResolver() {
  const [{ data: clubs, error: clubsError }, { data: mappings, error: mappingsError }] = await Promise.all([
    supabase.from("clubs").select("id, name"),
    supabase.from("external_club_mapping").select("external_club_id, club_name, source").eq("source", SOURCE),
  ]);
  if (clubsError) fail("Vereine konnten nicht geladen werden.", clubsError);
  if (mappingsError) fail("Vereinszuordnungen konnten nicht geladen werden.", mappingsError);
  const clubsByName = new Map((clubs ?? []).map((club) => [normalizeTeamName(club.name), club]));
  const clubsByExternalId = new Map();
  for (const mapping of mappings ?? []) {
    const club = clubsByName.get(normalizeTeamName(mapping.club_name));
    if (club) clubsByExternalId.set(String(mapping.external_club_id), club);
  }
  return (externalClubId) => clubsByExternalId.get(String(externalClubId))?.id ?? null;
}

async function matchTeamsByName(sourceTeams, existingTeams, resolveClubId) {
  const { data, error } = await supabase
    .from("teams")
    .select(
      "id, name, club_id, external_permanent_team_id, external_season_team_id, external_team_competition_id"
    )
    .eq("league_id", INTERNAL_LEAGUE_ID);
  if (error)
    fail("Teams für den Namensabgleich konnten nicht geladen werden.", error);

  for (const sourceTeam of sourceTeams.values()) {
    if (sourceTeam.teamPermanentId == null) continue;
    if (existingTeams.has(Number(sourceTeam.teamPermanentId))) continue;

    const candidates = (data ?? []).filter(
      (internalTeam) =>
        normalizeTeamName(internalTeam.name) ===
        normalizeTeamName(sourceTeam.name)
    );

    if (candidates.length !== 1) {
      if (candidates.length > 1) {
        console.warn(
          `Keine automatische Zuordnung für "${sourceTeam.name}": Name ist mehrfach vorhanden.`
        );
      }
      continue;
    }

    const matched = candidates[0];
    const { data: updated, error: updateError } = await supabase
      .from("teams")
      .update({
        external_permanent_team_id: sourceTeam.teamPermanentId,
        external_season_team_id: sourceTeam.seasonTeamId,
        external_team_competition_id: sourceTeam.teamCompetitionId,
        ...(matched.club_id || !resolveClubId(sourceTeam.clubId)
          ? {}
          : { club_id: resolveClubId(sourceTeam.clubId) }),
        external_source: SOURCE,
        external_synced_at: new Date().toISOString(),
      })
      .eq("id", matched.id)
      .select(
      "id, name, external_permanent_team_id, external_season_team_id, external_team_competition_id"
      )
      .single();
    if (updateError)
      fail(
        `Team "${sourceTeam.name}" konnte nicht zugeordnet werden.`,
        updateError
      );

    existingTeams.set(Number(sourceTeam.teamPermanentId), updated);
    console.log(
      `Team zugeordnet: "${sourceTeam.name}" → ${sourceTeam.teamPermanentId}`
    );
  }
}

async function insertUnknownTeams(unknownTeams, existingTeams, resolveClubId) {
  for (const team of unknownTeams) {
    const clubId = resolveClubId(team.clubId);
    const values = {
      name: team.name,
      age_group: "unbekannt",
      league_id: INTERNAL_LEAGUE_ID,
      ...(clubId ? { club_id: clubId } : {}),
      external_permanent_team_id: team.teamPermanentId,
      external_season_team_id: team.seasonTeamId,
      external_team_competition_id: team.teamCompetitionId,
      external_source: SOURCE,
      external_synced_at: new Date().toISOString(),
    };
    const { data: created, error } = await supabase.from("teams").insert(values).select("id, name, club_id, external_permanent_team_id").single();
    if (error) fail(`Team "${team.name}" konnte nicht angelegt werden.`, error);
    existingTeams.set(Number(team.teamPermanentId), created);
    console.log(`Team angelegt: "${team.name}"${clubId ? " (Verein zugeordnet)" : " (Verein offen)"}`);
  }
}

async function syncGames(matches, teamsByPermanentId, seasonId) {
  let synced = 0;
  let skipped = 0;
  for (const match of matches ?? []) {
    const home = teamsByPermanentId.get(
      Number(match.homeTeam?.teamPermanentId)
    );
    const away = teamsByPermanentId.get(
      Number(match.guestTeam?.teamPermanentId)
    );
    if (!home || !away) {
      skipped += 1;
      console.warn(
        `Übersprungen: Spiel ${match.matchId} – interne Team-Zuordnung fehlt.`
      );
      continue;
    }

    const score = parseResult(match.result);
    const values = {
      league_id: INTERNAL_LEAGUE_ID,
      home_team_id: home.id,
      away_team_id: away.id,
      game_date: match.kickoffDate,
      game_time: match.kickoffTime ?? null,
      home_score: score.home,
      away_score: score.away,
      external_match_id: match.matchId,
      external_match_day: match.matchDay ?? null,
      external_source: SOURCE,
      result_confirmed: match.ergebnisbestaetigt ?? false,
      cancelled: match.abgesagt ?? false,
      external_synced_at: new Date().toISOString(),
    };

    const { data: existing, error: findError } = await supabase
      .from("games")
      .select("id")
      .eq("external_source", SOURCE)
      .eq("external_match_id", match.matchId)
      .maybeSingle();
    if (findError)
      fail(`Spiel ${match.matchId} konnte nicht gesucht werden.`, findError);

    const query = existing
      ? supabase.from("games").update(values).eq("id", existing.id)
      : supabase.from("games").insert(values);
    const { error } = await query;
    if (error)
      fail(`Spiel ${match.matchId} konnte nicht gespeichert werden.`, error);
    synced += 1;
  }
  return { synced, skipped };
}

async function syncStandings(entries, teamsByPermanentId) {
  let synced = 0;
  for (const entry of entries ?? []) {
    const team = teamsByPermanentId.get(Number(entry.team?.teamPermanentId));
    if (!team) continue;

    const values = {
      league_id: INTERNAL_LEAGUE_ID,
      team_id: team.id,
      position: entry.rang ?? 0,
      games_played: entry.anzspiele ?? 0,
      wins: entry.s ?? 0,
      losses: entry.n ?? 0,
      points: entry.anzGewinnpunkte ?? 0,
      updated_at: new Date().toISOString(),
    };
    const { data: existing, error: findError } = await supabase
      .from("standings")
      .select("id")
      .eq("league_id", INTERNAL_LEAGUE_ID)
      .eq("team_id", team.id)
      .maybeSingle();
    if (findError)
      fail("Tabellenplatz konnte nicht gesucht werden.", findError);

    const query = existing
      ? supabase.from("standings").update(values).eq("id", existing.id)
      : supabase.from("standings").insert(values);
    const { error } = await query;
    if (error) fail("Tabelle konnte nicht gespeichert werden.", error);
    synced += 1;
  }
  return synced;
}

try {
  console.log(`Abruf: ${API_URL}`);
  const data = await fetchSource();
  const liga = await syncLeague(data);
  const existingTeams = await loadExistingTeams();
  const resolveClubId = await loadClubResolver();
  const sourceTeams = new Map();

  for (const match of data.matches ?? []) {
    for (const rawTeam of [match.homeTeam, match.guestTeam]) {
      const current = apiTeam(rawTeam);
      if (current?.teamPermanentId != null)
        sourceTeams.set(Number(current.teamPermanentId), current);
    }
  }

  await matchTeamsByName(sourceTeams, existingTeams, resolveClubId);

  const unmatchedTeams = [...sourceTeams.values()].filter(
    (team) => !existingTeams.has(Number(team.teamPermanentId))
  );
  if (unmatchedTeams.length)
    await insertUnknownTeams(unmatchedTeams, existingTeams, resolveClubId);

  const gameResult = await syncGames(
    data.matches,
    existingTeams,
    liga.seasonId
  );
  const standingsCount = await syncStandings(
    data.tabelle?.entries,
    existingTeams
  );
  console.log(
    `Fertig: ${gameResult.synced} Spiele, ${standingsCount} Tabellenplätze synchronisiert.`
  );
  if (unmatchedTeams.length)
    console.warn(`${unmatchedTeams.length} neue Teams direkt in teams angelegt.`);
  if (gameResult.skipped)
    console.warn(
      `${gameResult.skipped} Spiele wegen fehlender Team-Zuordnung übersprungen.`
    );
} catch (error) {
  console.error(
    `Synchronisierung fehlgeschlagen: ${error instanceof Error ? error.message : error}`
  );
  process.exit(1);
}

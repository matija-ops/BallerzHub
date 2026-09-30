#!/usr/bin/env node

// Node.js 18+ (native fetch)
// Beispiel: node scripts/fetch-basketball-bund.mjs 54610 --out data/basketball-bund-54610.json

import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const args = process.argv.slice(2);
const leagueId = args.find((arg) => /^\d+$/.test(arg));
const outIndex = args.indexOf("--out");
const outputPath = outIndex >= 0 ? args[outIndex + 1] : undefined;

if (!leagueId) {
  console.error("Verwendung: node scripts/fetch-basketball-bund.mjs <ligaId> [--out <datei.json>]");
  process.exit(1);
}

const url = `https://www.basketball-bund.net/rest/competition/actual/id/${leagueId}`;

function team(team) {
  if (!team) return null;
  return {
    seasonTeamId: team.seasonTeamId ?? null,
    teamCompetitionId: team.teamCompetitionId ?? null,
    teamPermanentId: team.teamPermanentId ?? null,
    teamname: team.teamname ?? null,
    clubId: team.clubId ?? null,
  };
}

function normalize(payload) {
  const data = payload?.data ?? {};
  const liga = data.ligaData ?? {};
  const normalizedTeam = (value) => team(value);
  const matches = data.matches ?? [];

  const teams = [...matches.flatMap((match) => [team(match.homeTeam), team(match.guestTeam)]), ...(data.tabelle?.entries ?? []).map((entry) => team(entry.team))]
    .filter(Boolean)
    .filter((value, index, values) => values.findIndex((candidate) => candidate.teamPermanentId === value.teamPermanentId) === index);

  return {
    fetchedAt: new Date().toISOString(),
    source: url,
    liga: {
      ligaId: liga.ligaId ?? Number(leagueId),
      seasonId: liga.seasonId ?? null,
      seasonName: liga.seasonName ?? null,
      liganame: liga.liganame ?? null,
    },
    teams,
    matches: matches.map((match) => ({
      matchId: match.matchId ?? null,
      ligaId: liga.ligaId ?? Number(leagueId),
      seasonId: liga.seasonId ?? null,
      matchDay: match.matchDay ?? null,
      kickoffDate: match.kickoffDate ?? null,
      kickoffTime: match.kickoffTime ?? null,
      result: match.result ?? null,
      resultConfirmed: match.ergebnisbestaetigt ?? false,
      cancelled: match.abgesagt ?? false,
      homeTeam: normalizedTeam(match.homeTeam),
      guestTeam: normalizedTeam(match.guestTeam),
    })),
    standings: (data.tabelle?.entries ?? []).map((entry) => ({
      rank: entry.rang ?? null,
      teamPermanentId: entry.team?.teamPermanentId ?? null,
      games: entry.anzspiele ?? null,
      wins: entry.s ?? null,
      losses: entry.n ?? null,
      pointsFor: entry.koerbe ?? null,
      pointsAgainst: entry.gegenKoerbe ?? null,
      pointDifference: entry.korbdiff ?? null,
    })),
  };
}

try {
  const response = await fetch(url, { headers: { accept: "application/json, text/plain, */*" } });
  if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);

  const payload = await response.json();
  if (payload?.status && payload.status !== "0") throw new Error(payload.message || `API-Status ${payload.status}`);

  const json = `${JSON.stringify(normalize(payload), null, 2)}\n`;
  if (outputPath) {
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, json, "utf8");
    console.log(`Gespeichert: ${outputPath}`);
  } else {
    console.log(json);
  }
} catch (error) {
  console.error(`Abruf fehlgeschlagen: ${error instanceof Error ? error.message : error}`);
  process.exit(1);
}

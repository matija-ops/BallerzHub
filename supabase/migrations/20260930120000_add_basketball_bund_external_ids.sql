-- Basketball-Bund-Synchronisierung
-- Externe Quelle: https://www.basketball-bund.net
-- Die externen IDs werden zusätzlich zu den internen UUIDs gespeichert.

alter table public.leagues
  add column if not exists external_liga_id bigint,
  add column if not exists external_season_id bigint,
  add column if not exists external_source text,
  add column if not exists external_synced_at timestamptz;

alter table public.teams
  add column if not exists external_permanent_team_id bigint,
  add column if not exists external_season_team_id bigint,
  add column if not exists external_team_competition_id bigint,
  add column if not exists external_source text,
  add column if not exists external_synced_at timestamptz;

alter table public.games
  add column if not exists external_match_id bigint,
  add column if not exists external_match_day integer,
  add column if not exists external_source text,
  add column if not exists result_confirmed boolean not null default false,
  add column if not exists cancelled boolean not null default false,
  add column if not exists external_synced_at timestamptz;

-- Kommende Spiele haben in der API noch kein Ergebnis.
alter table public.games
  alter column home_score drop not null,
  alter column away_score drop not null;

-- Verhindert doppelte Zuordnungen innerhalb der externen Quelle.
create unique index if not exists leagues_external_source_liga_season_idx
  on public.leagues (external_source, external_liga_id, external_season_id)
  where external_source is not null
    and external_liga_id is not null
    and external_season_id is not null;

create unique index if not exists teams_external_source_permanent_id_idx
  on public.teams (external_source, external_permanent_team_id)
  where external_source is not null
    and external_permanent_team_id is not null;

create unique index if not exists games_external_source_match_id_idx
  on public.games (external_source, external_match_id)
  where external_source is not null
    and external_match_id is not null;

comment on column public.leagues.external_liga_id is
  'Liga-ID der externen Datenquelle, z. B. basketball-bund.net';
comment on column public.teams.external_permanent_team_id is
  'Dauerhafte Team-ID der externen Datenquelle';
comment on column public.games.external_match_id is
  'Spiel-ID der externen Datenquelle';

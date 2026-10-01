-- Kommunen werden für die Auswahl beim Freigeben von Court-Vorschlägen benötigt.
-- Leserechte werden geöffnet; Schreibrechte bleiben unverändert.
alter table public.municipalities enable row level security;

create policy "Municipalities are publicly readable"
  on public.municipalities
  for select
  to anon, authenticated
  using (true);

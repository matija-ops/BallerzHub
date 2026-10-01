-- Court-Bilder gehören zur öffentlichen Court-Ansicht und müssen von allen
-- Besuchern gelesen werden können. Schreibrechte bleiben unverändert.
alter table public.court_images enable row level security;

create policy "Court images are publicly readable"
  on public.court_images
  for select
  to anon, authenticated
  using (true);

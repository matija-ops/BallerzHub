-- Municipality-User dürfen Bilder von Courts ihrer eigenen Kommune löschen.
create policy "Municipality users can delete their court images"
  on public.court_images
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.courts c
      join public.municipality_users mu
        on mu.municipality_id = c.municipality_id
      where c.id = court_images.court_id
        and mu.user_id = auth.uid()
    )
  );

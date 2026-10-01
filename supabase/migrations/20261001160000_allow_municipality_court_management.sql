-- Municipality-User dürfen Courts ihrer eigenen Kommune verwalten.
create policy "Municipality users can read their courts"
  on public.courts
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.municipality_users mu
      where mu.user_id = auth.uid()
        and mu.municipality_id = courts.municipality_id
    )
  );

create policy "Municipality users can update their courts"
  on public.courts
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.municipality_users mu
      where mu.user_id = auth.uid()
        and mu.municipality_id = courts.municipality_id
    )
  )
  with check (
    exists (
      select 1
      from public.municipality_users mu
      where mu.user_id = auth.uid()
        and mu.municipality_id = courts.municipality_id
    )
  );

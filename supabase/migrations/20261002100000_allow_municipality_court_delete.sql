create policy "Municipality users can delete their courts"
  on public.courts
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.municipality_users mu
      where mu.user_id = auth.uid()
        and mu.municipality_id = courts.municipality_id
    )
  );

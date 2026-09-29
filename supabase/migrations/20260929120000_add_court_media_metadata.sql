-- Store the uploader and distinguish images from videos without introducing a
-- parallel media table. Columns remain nullable so existing media rows stay valid.
alter table public.court_images
  add column if not exists user_id uuid references public.profiles(id) on delete set null,
  add column if not exists media_type text not null default 'image';

alter table public.court_proposal_images
  add column if not exists user_id uuid references public.profiles(id) on delete set null,
  add column if not exists media_type text not null default 'image';

alter table public.court_images
  drop constraint if exists court_images_media_type_check,
  add constraint court_images_media_type_check check (media_type in ('image', 'video'));

alter table public.court_proposal_images
  drop constraint if exists court_proposal_images_media_type_check,
  add constraint court_proposal_images_media_type_check check (media_type in ('image', 'video'));

-- The project already uses this public bucket for proposal images. Keep it and
-- separate court and proposal objects by their first path segment.
insert into storage.buckets (id, name, public)
values ('court_proposals', 'court_proposals', true)
on conflict (id) do nothing;

alter table public.court_images enable row level security;
alter table public.court_proposal_images enable row level security;

-- Do not alter existing read policies: they may already expose approved court
-- media and restrict proposal media for municipal administrators.
drop policy if exists "Authenticated users add own court media" on public.court_images;
create policy "Authenticated users add own court media"
  on public.court_images for insert to authenticated
  with check (
    user_id = auth.uid()
    or exists (
      select 1 from public.municipality_users
      where municipality_users.user_id = auth.uid()
    )
  );

drop policy if exists "Authenticated users add own proposal media" on public.court_proposal_images;
create policy "Authenticated users add own proposal media"
  on public.court_proposal_images for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.court_proposals
      where court_proposals.id = court_proposal_images.proposal_id
        and court_proposals.user_id = auth.uid()
    )
  );

drop policy if exists "Users delete own court media" on storage.objects;
create policy "Users delete own court media"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'court_proposals'
    and (storage.foldername(name))[1] in ('courts', 'proposals')
    and (storage.foldername(name))[3] = auth.uid()::text
  );

drop policy if exists "Users upload own court media" on storage.objects;
create policy "Users upload own court media"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'court_proposals'
    and (storage.foldername(name))[1] in ('courts', 'proposals')
    and (storage.foldername(name))[3] = auth.uid()::text
  );

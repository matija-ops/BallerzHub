-- Complete, repeatable setup for authenticated court uploads.
-- Includes the earlier media-column migration so this file can also be run
-- directly in the Supabase SQL Editor if that migration was not yet applied.
-- Existing admin/moderation policies are preserved.
begin;

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

-- Preserve the municipal workflow that copies proposal images to court_images
-- with the original uploader when a proposal is approved.
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

-- INSERT ... RETURNING and the subsequent media count need SELECT privileges
-- as well as an INSERT policy. These grants remain constrained by RLS.
grant select, insert on public.court_images to authenticated;
grant select, insert on public.court_proposal_images to authenticated;
grant select, insert on public.court_proposals to authenticated;

alter table public.court_proposals enable row level security;

drop policy if exists "Users create own pending court proposals" on public.court_proposals;
create policy "Users create own pending court proposals"
  on public.court_proposals for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and status = 'pending'
  );

drop policy if exists "Users read own court proposals" on public.court_proposals;
create policy "Users read own court proposals"
  on public.court_proposals for select to authenticated
  using (user_id = (select auth.uid()));

-- Only expose media attached to courts that this user can already read.
drop policy if exists "Users read visible court media" on public.court_images;
create policy "Users read visible court media"
  on public.court_images for select to authenticated
  using (
    exists (
      select 1 from public.courts
      where courts.id = court_images.court_id
    )
  );

drop policy if exists "Users read own proposal media" on public.court_proposal_images;
create policy "Users read own proposal media"
  on public.court_proposal_images for select to authenticated
  using (
    exists (
      select 1 from public.court_proposals
      where court_proposals.id = court_proposal_images.proposal_id
        and court_proposals.user_id = (select auth.uid())
    )
  );

-- The app uses getPublicUrl for both kinds of media.
update storage.buckets set public = true where id = 'court_proposals';

-- Needed to return uploaded objects and to clean up the user's own files if
-- saving the corresponding court_images row fails. DELETE is defined above.
drop policy if exists "Users read own court upload objects" on storage.objects;
create policy "Users read own court upload objects"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'court_proposals'
    and (storage.foldername(name))[1] in ('courts', 'proposals')
    and (storage.foldername(name))[3] = (select auth.uid())::text
  );

commit;

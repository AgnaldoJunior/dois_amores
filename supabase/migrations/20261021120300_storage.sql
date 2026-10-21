-- =============================================================================
-- Dois Amores · Storage
--   avatars/<user_id>/...      cada usuário escreve só na própria pasta
--   club-covers/<club_id>/...  só o dono do clube escreve
-- Buckets públicos para leitura (feed e páginas de clube exibem as imagens).
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp']),
  ('club-covers', 'club-covers', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Dono do clube a partir do primeiro segmento do caminho (sem erro para UUID inválido).
create or replace function public.is_club_owner_folder(p_folder text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.club_members
    where club_id::text = p_folder
      and user_id = auth.uid()
      and role = 'owner'
  );
$$;

revoke execute on function public.is_club_owner_folder(text) from public, anon;
grant execute on function public.is_club_owner_folder(text) to authenticated;

-- avatars ---------------------------------------------------------------------
create policy "avatars_select_own" on storage.objects
  for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "avatars_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "avatars_update_own" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "avatars_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- club-covers -----------------------------------------------------------------
create policy "club_covers_select_owner" on storage.objects
  for select to authenticated
  using (bucket_id = 'club-covers' and public.is_club_owner_folder((storage.foldername(name))[1]));

create policy "club_covers_insert_owner" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'club-covers' and public.is_club_owner_folder((storage.foldername(name))[1]));

create policy "club_covers_update_owner" on storage.objects
  for update to authenticated
  using (bucket_id = 'club-covers' and public.is_club_owner_folder((storage.foldername(name))[1]))
  with check (bucket_id = 'club-covers' and public.is_club_owner_folder((storage.foldername(name))[1]));

create policy "club_covers_delete_owner" on storage.objects
  for delete to authenticated
  using (bucket_id = 'club-covers' and public.is_club_owner_folder((storage.foldername(name))[1]));

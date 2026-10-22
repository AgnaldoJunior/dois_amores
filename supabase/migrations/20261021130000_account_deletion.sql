-- =============================================================================
-- Exclusão da própria conta (LGPD).
-- Clubes em que a pessoa é dona passam para o membro mais antigo; se ela for a
-- única integrante, o clube é excluído. Leituras, posts, votos e lista "Quero
-- ler" são removidos em cascata. A foto no Storage é removida pelo app antes
-- (o Supabase não permite apagar objetos do Storage via SQL).
-- =============================================================================

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  owned record;
  heir uuid;
begin
  if uid is null then
    raise exception 'Autenticação necessária' using errcode = '42501';
  end if;

  for owned in
    select club_id from public.club_members where user_id = uid and role = 'owner'
  loop
    select user_id into heir
    from public.club_members
    where club_id = owned.club_id and user_id <> uid
    order by joined_at, user_id
    limit 1;

    if heir is null then
      delete from public.clubs where id = owned.club_id;
    else
      update public.club_members set role = 'owner'
      where club_id = owned.club_id and user_id = heir;
    end if;
  end loop;

  delete from auth.users where id = uid;
end;
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

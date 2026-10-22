-- Exclusão da própria conta: dados somem e a posse dos clubes é transferida.
begin;
create extension if not exists pgtap with schema extensions;

select plan(7);

insert into auth.users (id, email, raw_user_meta_data) values
  ('ffffffff-0000-4000-8000-000000000001', 'sai@test.local',   '{"full_name": "Sai"}'),
  ('ffffffff-0000-4000-8000-000000000002', 'fica@test.local',  '{"full_name": "Fica"}');

insert into public.books (id, openlibrary_work_key, title)
values ('ffffffff-0000-4000-8000-0000000000b1', '/works/OL777001W', 'Livro');

create temporary table t (key text primary key, value uuid);
grant all on t to authenticated;

set local role authenticated;
set local request.jwt.claims to '{"sub": "ffffffff-0000-4000-8000-000000000001", "role": "authenticated"}';

insert into t values ('shared', (public.create_club('Compartilhado')).id);
insert into t values ('solo',   (public.create_club('Sozinha')).id);
insert into public.user_books (book_id, started_on, finished_on)
values ('ffffffff-0000-4000-8000-0000000000b1', '2026-10-01', '2026-10-05');

reset role;
insert into public.club_members (club_id, user_id, joined_at)
select value, 'ffffffff-0000-4000-8000-000000000002', now() + interval '1 minute' from t where key = 'shared';
set local role authenticated;

select lives_ok($$ select public.delete_my_account() $$, 'a pessoa exclui a própria conta');

reset role;
select is((select count(*)::int from auth.users where id = 'ffffffff-0000-4000-8000-000000000001'), 0, 'usuário removido do Auth');
select is((select count(*)::int from public.profiles where id = 'ffffffff-0000-4000-8000-000000000001'), 0, 'perfil removido');
select is((select count(*)::int from public.user_books where user_id = 'ffffffff-0000-4000-8000-000000000001'), 0, 'leituras removidas');
select is((select count(*)::int from public.posts where user_id = 'ffffffff-0000-4000-8000-000000000001'), 0, 'posts removidos');
select is(
  (select role from public.club_members
   where club_id = (select value from t where key = 'shared') and user_id = 'ffffffff-0000-4000-8000-000000000002'),
  'owner',
  'clube com outras pessoas passa para o membro mais antigo'
);
select is((select count(*)::int from public.clubs where id = (select value from t where key = 'solo')), 0,
  'clube em que ela era a única integrante é excluído');

select * from finish();
rollback;

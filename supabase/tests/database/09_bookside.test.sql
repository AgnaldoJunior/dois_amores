-- Perfil completo, estantes próprias, seguidores, curtidas, comentários, notificações e agenda.
begin;
create extension if not exists pgtap with schema extensions;

select plan(17);

insert into auth.users (id, email, raw_user_meta_data) values
  ('ffffffff-0000-4000-8000-000000000001', 'ana@b.local', '{"full_name": "Ana"}'),
  ('ffffffff-0000-4000-8000-000000000002', 'bia@b.local', '{"full_name": "Bia"}'),
  ('ffffffff-0000-4000-8000-000000000003', 'cris@b.local', '{"full_name": "Cris"}');

insert into public.books (id, openlibrary_work_key, title)
values ('ffffffff-0000-4000-8000-0000000000b1', '/works/OL990001W', 'Livro B');

select is((select onboarded_at from public.profiles where id = 'ffffffff-0000-4000-8000-000000000001'), null,
  'quem acabou de criar a conta ainda passa pelo cadastro do perfil');

set local role authenticated;
set local request.jwt.claims to '{"sub": "ffffffff-0000-4000-8000-000000000001", "role": "authenticated"}';

select lives_ok(
  $$ update public.profiles set username = 'ana.le', tagline = 'lê de tudo', reading_goal = 40, theme = 'madrugada'
     where id = 'ffffffff-0000-4000-8000-000000000001' $$,
  'preenche usuário, frase, meta e tema');
select throws_ok(
  $$ update public.profiles set username = 'Ana Lê' where id = 'ffffffff-0000-4000-8000-000000000001' $$,
  '23514', null, 'usuário só com letras minúsculas, números, ponto e sublinhado');

-- Ana lê e publica (o post nasce do trigger)
insert into public.user_books (user_id, book_id, started_on, finished_on, rank_plot)
values ('ffffffff-0000-4000-8000-000000000001', 'ffffffff-0000-4000-8000-0000000000b1', current_date - 3, current_date, 5);

-- Estante própria
insert into public.shelves (name) values ('lista de praia');
select lives_ok(
  $$ insert into public.shelf_books (shelf_id, book_id) select id, 'ffffffff-0000-4000-8000-0000000000b1'::uuid from public.shelves where name = 'lista de praia' $$,
  'coloca um livro na própria estante');
select lives_ok(
  $$ insert into public.profile_favorites (position, book_id) values (1, 'ffffffff-0000-4000-8000-0000000000b1') $$,
  'escolhe um favorito');

-- Bia segue, curte e comenta
set local request.jwt.claims to '{"sub": "ffffffff-0000-4000-8000-000000000002", "role": "authenticated"}';
select throws_ok(
  $$ insert into public.shelf_books (shelf_id, book_id) select id, 'ffffffff-0000-4000-8000-0000000000b1'::uuid from public.shelves where name = 'lista de praia' $$,
  '42501', null, 'não mexe na estante de outra pessoa');
select throws_ok(
  $$ insert into public.follows (follower_id, followee_id) values ('ffffffff-0000-4000-8000-000000000003', 'ffffffff-0000-4000-8000-000000000001') $$,
  '42501', null, 'não segue em nome de outra pessoa');
select throws_ok(
  $$ insert into public.follows (followee_id) values ('ffffffff-0000-4000-8000-000000000002') $$,
  '23514', null, 'não segue a si mesma');
insert into public.follows (followee_id) values ('ffffffff-0000-4000-8000-000000000001');
insert into public.post_likes (post_id) select id from public.posts where user_id = 'ffffffff-0000-4000-8000-000000000001';
insert into public.post_comments (post_id, body)
  select id, 'que ficha linda!' from public.posts where user_id = 'ffffffff-0000-4000-8000-000000000001';
select is((select count(*)::int from public.post_likes), 1, 'curte a ficha de outra pessoa');

-- Notificações da Ana
set local request.jwt.claims to '{"sub": "ffffffff-0000-4000-8000-000000000001", "role": "authenticated"}';
select results_eq(
  $$ select kind from public.my_notifications() order by kind $$,
  $$ values ('comment'::text), ('follow'), ('like') $$,
  'notificações: seguiram, curtiram e comentaram');
select lives_ok(
  $$ delete from public.post_comments where body = 'que ficha linda!' $$,
  'a autora da ficha pode apagar comentários');
select is((select count(*)::int from public.post_comments), 0, 'comentário apagado');

-- Cris não vê notificações da Ana
set local request.jwt.claims to '{"sub": "ffffffff-0000-4000-8000-000000000003", "role": "authenticated"}';
select is((select count(*)::int from public.my_notifications()), 0, 'cada uma vê só as próprias notificações');

-- Clube: agenda e prazo
set local request.jwt.claims to '{"sub": "ffffffff-0000-4000-8000-000000000001", "role": "authenticated"}';
create temp table t (key text primary key, value text) on commit drop;
grant all on t to authenticated;
insert into t select 'club', (public.create_club('Clube B')).id::text;
insert into public.club_events (club_id, title, happens_on)
  select value::uuid, 'conversa do clube', current_date + 7 from t where key = 'club';
insert into t select 'cb', (public.propose_club_book((select value::uuid from t where key = 'club'),
                                                      'ffffffff-0000-4000-8000-0000000000b1')).id::text;
select lives_ok(
  format($$ select public.set_club_book_due(%L, current_date + 20) $$, (select value from t where key = 'cb')),
  'membro define o prazo da leitura da vez');
select is((select due_on from public.club_books where id = (select value::uuid from t where key = 'cb')), current_date + 20,
  'prazo salvo');

set local request.jwt.claims to '{"sub": "ffffffff-0000-4000-8000-000000000003", "role": "authenticated"}';
select is((select count(*)::int from public.club_events), 0, 'quem não é do clube não vê a agenda');
select throws_ok(
  format($$ select public.set_club_book_due(%L, current_date + 5) $$, (select value from t where key = 'cb')),
  'P0002', null, 'quem não é do clube não muda o prazo');

select * from finish();
rollback;

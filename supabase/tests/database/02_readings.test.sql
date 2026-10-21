-- Perfis, catálogo, leituras, posts automáticos e lista "Quero ler".
begin;
create extension if not exists pgtap with schema extensions;

select plan(22);

-- Usuários de teste --------------------------------------------------------------
insert into auth.users (id, email, raw_user_meta_data) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'ana@test.local',
   '{"full_name": "Ana Teste", "picture": "https://lh3.googleusercontent.com/a/ana"}'),
  ('aaaaaaaa-0000-4000-8000-000000000002', 'bia@test.local', '{}');

select is(
  (select name from public.profiles where id = 'aaaaaaaa-0000-4000-8000-000000000001'),
  'Ana Teste',
  'perfil criado no cadastro com o nome do provedor'
);
select is(
  (select avatar_url from public.profiles where id = 'aaaaaaaa-0000-4000-8000-000000000001'),
  'https://lh3.googleusercontent.com/a/ana',
  'foto do Google vira avatar_url'
);
select is(
  (select name from public.profiles where id = 'aaaaaaaa-0000-4000-8000-000000000002'),
  'bia',
  'sem nome no provedor, usa o início do e-mail'
);

-- Como Ana -------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims to '{"sub": "aaaaaaaa-0000-4000-8000-000000000001", "role": "authenticated"}';

select throws_ok(
  $$ insert into public.books (openlibrary_work_key, title) values ('/works/OL1W', 'X') $$,
  '42501', null,
  'não insere em books diretamente'
);

select lives_ok(
  $$ select public.upsert_book('/works/OL999001W', 'Livro de Teste', 'Autora', null, null, null) $$,
  'upsert_book cria o livro'
);
select lives_ok(
  $$ select public.upsert_book('/works/OL999001W', 'Outro título', 'Outra autora', 321, null, 'Resumo') $$,
  'upsert_book do mesmo work key não falha'
);
select results_eq(
  $$ select title, author, pages, summary from public.books where openlibrary_work_key = '/works/OL999001W' $$,
  $$ values ('Livro de Teste'::text, 'Autora'::text, 321, 'Resumo'::text) $$,
  'upsert_book completa campos vazios sem sobrescrever os preenchidos'
);
select throws_ok(
  $$ select public.upsert_book('/works/OL999002W', 'Capa suspeita', null, null, 'https://evil.example/x.jpg', null) $$,
  '23514', null,
  'capa só pode vir da Open Library'
);

-- Quero ler
insert into public.reading_list (book_id)
select id from public.books where openlibrary_work_key = '/works/OL999001W';
select is((select count(*)::int from public.reading_list), 1, 'livro adicionado ao "Quero ler"');

-- Leitura em andamento: sem post
insert into public.user_books (book_id, started_on)
select id, '2026-10-01' from public.books where openlibrary_work_key = '/works/OL999001W';

select is((select count(*)::int from public.reading_list), 0, 'ao começar a ler, o livro sai do "Quero ler"');
select is(
  (select count(*)::int from public.posts where user_id = 'aaaaaaaa-0000-4000-8000-000000000001'),
  0,
  'leitura sem data de fim não gera post'
);

update public.user_books set finished_on = '2026-10-12', rank_characters = 5
where user_id = 'aaaaaaaa-0000-4000-8000-000000000001';
select is(
  (select count(*)::int from public.posts where user_id = 'aaaaaaaa-0000-4000-8000-000000000001'),
  1,
  'preencher a data de fim cria o post no feed'
);

update public.user_books set comment = 'editado'
where user_id = 'aaaaaaaa-0000-4000-8000-000000000001';
select is(
  (select count(*)::int from public.posts where user_id = 'aaaaaaaa-0000-4000-8000-000000000001'),
  1,
  'editar outros campos não duplica o post'
);

update public.user_books set finished_on = null
where user_id = 'aaaaaaaa-0000-4000-8000-000000000001';
select is(
  (select count(*)::int from public.posts where user_id = 'aaaaaaaa-0000-4000-8000-000000000001'),
  0,
  'apagar a data de fim remove o post'
);

select throws_ok(
  $$ update public.user_books set rank_plot = 6 where user_id = 'aaaaaaaa-0000-4000-8000-000000000001' $$,
  '23514', null,
  'nota fora de 1..5 é recusada'
);
select throws_ok(
  $$ update public.user_books set finished_on = '2026-09-01' where user_id = 'aaaaaaaa-0000-4000-8000-000000000001' $$,
  '23514', null,
  'fim antes do início é recusado'
);
select throws_ok(
  $$ insert into public.user_books (user_id, book_id, started_on)
     select 'aaaaaaaa-0000-4000-8000-000000000002', id, '2026-10-01' from public.books limit 1 $$,
  '42501', null,
  'não cria leitura em nome de outra pessoa'
);
select throws_ok(
  $$ insert into public.posts (user_id, user_book_id) select user_id, id from public.user_books limit 1 $$,
  '42501', null,
  'não cria post manualmente'
);

insert into public.reading_list (book_id)
select id from public.books where openlibrary_work_key <> '/works/OL999001W' limit 1;

-- Como Bia ---------------------------------------------------------------------------
set local request.jwt.claims to '{"sub": "aaaaaaaa-0000-4000-8000-000000000002", "role": "authenticated"}';

select is(
  (select count(*)::int from public.user_books where user_id = 'aaaaaaaa-0000-4000-8000-000000000001'),
  1,
  'leituras de outras pessoas são visíveis (feed e resumos)'
);

update public.user_books set comment = 'invadido'
where user_id = 'aaaaaaaa-0000-4000-8000-000000000001';
delete from public.user_books where user_id = 'aaaaaaaa-0000-4000-8000-000000000001';
update public.profiles set name = 'invadido' where id = 'aaaaaaaa-0000-4000-8000-000000000001';

reset role;
select is(
  (select comment from public.user_books where user_id = 'aaaaaaaa-0000-4000-8000-000000000001'),
  'editado',
  'não altera a leitura de outra pessoa'
);
select is(
  (select name from public.profiles where id = 'aaaaaaaa-0000-4000-8000-000000000001'),
  'Ana Teste',
  'não altera o perfil de outra pessoa'
);

set local role authenticated;
set local request.jwt.claims to '{"sub": "aaaaaaaa-0000-4000-8000-000000000002", "role": "authenticated"}';
select is(
  (select count(*)::int from public.reading_list where user_id = 'aaaaaaaa-0000-4000-8000-000000000001'),
  0,
  '"Quero ler" de outra pessoa não é visível'
);

select * from finish();
rollback;

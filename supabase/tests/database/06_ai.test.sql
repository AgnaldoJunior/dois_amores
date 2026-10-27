-- IA: limite diário e metadados do resumo.
begin;
create extension if not exists pgtap with schema extensions;

select plan(10);

insert into auth.users (id, email) values ('99999999-0000-4000-8000-000000000001', 'ia@test.local');

select ok(public.consume_ai_quota('99999999-0000-4000-8000-000000000001', 2), '1ª chamada dentro do limite');
select ok(public.consume_ai_quota('99999999-0000-4000-8000-000000000001', 2), '2ª chamada dentro do limite');
select ok(not public.consume_ai_quota('99999999-0000-4000-8000-000000000001', 2), '3ª chamada passa do limite');
select is(
  (select calls from public.ai_usage where user_id = '99999999-0000-4000-8000-000000000001'),
  2,
  'o contador não passa do limite'
);

select lives_ok($$ select public.refund_ai_quota('99999999-0000-4000-8000-000000000001') $$, 'devolve uma chamada');
select is(
  (select calls from public.ai_usage where user_id = '99999999-0000-4000-8000-000000000001'),
  1,
  'cota devolvida quando a IA falha'
);

select ok(
  not has_function_privilege('authenticated', 'public.consume_ai_quota(uuid, integer)', 'execute'),
  'usuários não consomem cota direto (só a Edge Function)'
);
select ok(
  not has_column_privilege('authenticated', 'public.books', 'summary', 'update'),
  'usuários não editam resumos'
);

insert into public.books (id, openlibrary_work_key, title, summary, summary_lang)
values ('99999999-0000-4000-8000-0000000000b1', '/works/OL555001W', 'Livro', 'Old text', 'en');
update public.books set summary = 'New text' where id = '99999999-0000-4000-8000-0000000000b1';
select is(
  (select summary_lang from public.books where id = '99999999-0000-4000-8000-0000000000b1'),
  null,
  'resumo novo da Open Library volta a ser "idioma não verificado"'
);

update public.books
set summary = 'Texto traduzido', summary_original = 'New text', summary_source = 'ai_translation', summary_lang = 'pt'
where id = '99999999-0000-4000-8000-0000000000b1';
select is(
  (select summary_lang from public.books where id = '99999999-0000-4000-8000-0000000000b1'),
  'pt',
  'tradução por IA mantém o idioma marcado'
);

select * from finish();
rollback;

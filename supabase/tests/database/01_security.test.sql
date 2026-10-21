-- Segurança geral: RLS em todas as tabelas, anon sem acesso, funções internas fechadas.
begin;
create extension if not exists pgtap with schema extensions;

select plan(9);

select is(
  (select count(*)::int from pg_tables where schemaname = 'public' and not rowsecurity),
  0,
  'RLS ativo em todas as tabelas do schema public'
);

select is(
  (select count(*)::int from pg_class c
   where c.relnamespace = 'public'::regnamespace
     and c.relkind = 'r'
     and has_table_privilege('anon', c.oid, 'select')),
  0,
  'anon não tem SELECT em nenhuma tabela'
);

select ok(
  not has_table_privilege('authenticated', 'public.posts', 'insert'),
  'authenticated não insere posts diretamente (só o trigger)'
);

select ok(
  not has_table_privilege('authenticated', 'public.books', 'insert'),
  'authenticated não insere livros diretamente (só upsert_book)'
);

select ok(
  not has_column_privilege('authenticated', 'public.clubs', 'invite_code', 'update'),
  'authenticated não altera o código de convite diretamente'
);

select ok(
  not has_column_privilege('authenticated', 'public.user_books', 'user_id', 'update'),
  'authenticated não troca o dono de uma leitura'
);

select ok(
  not has_function_privilege('authenticated', 'public.evaluate_club_book(uuid)', 'execute'),
  'evaluate_club_book é interna'
);

select ok(
  not has_function_privilege('anon', 'public.join_club(text)', 'execute'),
  'anon não chama RPCs'
);

select ok(
  has_function_privilege('authenticated', 'public.join_club(text)', 'execute'),
  'authenticated chama join_club'
);

select * from finish();
rollback;

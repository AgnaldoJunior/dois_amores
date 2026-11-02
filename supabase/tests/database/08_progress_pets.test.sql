-- Página atual das leituras em andamento, bichinho e avatar ilustrado do perfil.
begin;
create extension if not exists pgtap with schema extensions;

select plan(9);

insert into auth.users (id, email, raw_user_meta_data) values
  ('eeeeeeee-0000-4000-8000-000000000001', 'eva@test.local', '{"full_name": "Eva"}'),
  ('eeeeeeee-0000-4000-8000-000000000002', 'flor@test.local', '{"full_name": "Flor"}');

insert into public.books (id, openlibrary_work_key, title, pages)
values ('eeeeeeee-0000-4000-8000-0000000000b1', '/works/OL880001W', 'Livro em andamento', 400);

set local role authenticated;
set local request.jwt.claims to '{"sub": "eeeeeeee-0000-4000-8000-000000000001", "role": "authenticated"}';

insert into public.user_books (user_id, book_id, started_on)
values ('eeeeeeee-0000-4000-8000-000000000001', 'eeeeeeee-0000-4000-8000-0000000000b1', current_date);

select lives_ok(
  $$ update public.user_books set current_page = 152
     where user_id = 'eeeeeeee-0000-4000-8000-000000000001' $$,
  'atualiza a página atual da própria leitura'
);
select is(
  (select current_page from public.user_books where user_id = 'eeeeeeee-0000-4000-8000-000000000001'),
  152,
  'página atual salva'
);
select throws_ok(
  $$ update public.user_books set current_page = -1
     where user_id = 'eeeeeeee-0000-4000-8000-000000000001' $$,
  '23514', null,
  'página atual não pode ser negativa'
);

select lives_ok(
  $$ update public.profiles set pet = '🐵' where id = 'eeeeeeee-0000-4000-8000-000000000001' $$,
  'escolhe o próprio bichinho'
);

set local request.jwt.claims to '{"sub": "eeeeeeee-0000-4000-8000-000000000002", "role": "authenticated"}';
update public.profiles set pet = '🦊' where id = 'eeeeeeee-0000-4000-8000-000000000001';
select is(
  (select pet from public.profiles where id = 'eeeeeeee-0000-4000-8000-000000000001'),
  '🐵',
  'não troca o bichinho de outra pessoa'
);
select throws_ok(
  $$ update public.profiles set pet = repeat('x', 17) where id = 'eeeeeeee-0000-4000-8000-000000000002' $$,
  '23514', null,
  'bichinho é um emoji, não um texto longo'
);

select lives_ok(
  $$ update public.profiles
     set avatar_mode = 'illustrated',
         avatar_config = '{"skin": 1, "hair": 2, "style": "bob", "glasses": "cat", "shirt": 0, "extras": "bow"}'
     where id = 'eeeeeeee-0000-4000-8000-000000000002' $$,
  'salva o próprio avatar ilustrado'
);
select throws_ok(
  $$ update public.profiles set avatar_mode = 'emoji' where id = 'eeeeeeee-0000-4000-8000-000000000002' $$,
  '23514', null,
  'modo do avatar é foto ou ilustrado'
);
select throws_ok(
  $$ update public.profiles set avatar_config = '[1, 2]' where id = 'eeeeeeee-0000-4000-8000-000000000002' $$,
  '23514', null,
  'configuração do avatar é um objeto'
);

select * from finish();
rollback;

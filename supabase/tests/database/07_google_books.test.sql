-- Enriquecimento: capas no bucket "covers" e sinopse da Google Books.
begin;
create extension if not exists pgtap with schema extensions;

select plan(7);

select is(
  (select public from storage.buckets where id = 'covers'),
  true,
  'bucket covers existe e é público para leitura'
);

insert into public.books (id, openlibrary_work_key, title)
values ('77777777-0000-4000-8000-0000000000b1', '/works/OL444001W', 'Livro');

select lives_ok(
  $$ update public.books
     set cover_url = 'https://abc.supabase.co/storage/v1/object/public/covers/77777777-0000-4000-8000-0000000000b1.jpg'
     where id = '77777777-0000-4000-8000-0000000000b1' $$,
  'aceita capa copiada para o bucket covers'
);
select throws_ok(
  $$ update public.books
     set cover_url = 'https://abc.supabase.co/storage/v1/object/public/avatars/x.jpg'
     where id = '77777777-0000-4000-8000-0000000000b1' $$,
  '23514', null,
  'recusa capa de outro bucket'
);
select throws_ok(
  $$ update public.books set cover_url = 'https://books.google.com/books/content?id=x'
     where id = '77777777-0000-4000-8000-0000000000b1' $$,
  '23514', null,
  'recusa link direto da Google (a capa precisa ser copiada)'
);

update public.books
set summary = 'Sinopse da editora.', summary_source = 'google_books', summary_lang = 'pt', enriched_at = now()
where id = '77777777-0000-4000-8000-0000000000b1';
select is(
  (select summary_lang from public.books where id = '77777777-0000-4000-8000-0000000000b1'),
  'pt',
  'sinopse da Google Books fica marcada como português (não vai para a IA)'
);

insert into auth.users (id, email) values ('77777777-0000-4000-8000-000000000001', 'capa@test.local');
set local role authenticated;
set local request.jwt.claims to '{"sub": "77777777-0000-4000-8000-000000000001", "role": "authenticated"}';

select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('covers', '77777777-0000-4000-8000-0000000000b1.jpg') $$,
  '42501', null,
  'usuários não gravam no bucket covers'
);
select throws_ok(
  $$ update public.books set enriched_at = now() where id = '77777777-0000-4000-8000-0000000000b1' $$,
  '42501', null,
  'usuários não marcam livros como enriquecidos'
);

select * from finish();
rollback;

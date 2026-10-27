-- =============================================================================
-- Enriquecimento pela Google Books.
--
-- A Open Library continua sendo a identidade do livro (openlibrary_work_key).
-- Ao salvar um livro, a Edge Function "books" procura a edição em português na
-- Google Books e, se achar, usa a sinopse brasileira e a capa (copiada para o
-- bucket "covers", servido pelo próprio Supabase e com CORS para o PDF).
-- =============================================================================

alter table public.books
  -- null = ainda não tentou; preenchido mesmo quando a Google não tinha o livro.
  add column enriched_at timestamptz,
  add column google_volume_id text check (char_length(google_volume_id) <= 64);

-- Sinopse pode vir da editora brasileira (Google Books).
alter table public.books drop constraint books_summary_source_check;
alter table public.books add constraint books_summary_source_check
  check (summary_source in ('openlibrary', 'google_books', 'ai_translation'));

-- Capa: Open Library (até ser copiada) ou o bucket "covers" do próprio projeto.
alter table public.books drop constraint books_cover_url_check;
alter table public.books add constraint books_cover_url_check
  check (
    cover_url ~ '^https://covers\.openlibrary\.org/'
    or cover_url ~ '^https?://[^/]+/storage/v1/object/public/covers/[0-9a-f-]+\.jpg$'
  );

-- Bucket público para leitura; sem políticas de escrita: só a service_role (Edge Function) grava.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('covers', 'covers', true, 3145728, array['image/jpeg'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

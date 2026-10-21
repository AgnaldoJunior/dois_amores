-- =============================================================================
-- Dois Amores · esquema base
-- =============================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- profiles: 1:1 com auth.users, criado automaticamente no cadastro
-- -----------------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  name        text not null default '' check (char_length(name) <= 80),
  avatar_url  text check (char_length(avatar_url) <= 1000),
  bio         text check (char_length(bio) <= 500),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- books: catálogo compartilhado, alimentado pela Open Library
-- Escrita somente via public.upsert_book (security definer).
-- -----------------------------------------------------------------------------
create table public.books (
  id                    uuid primary key default gen_random_uuid(),
  openlibrary_work_key  text not null unique check (openlibrary_work_key ~ '^/works/OL[0-9]+W$'),
  title                 text not null check (char_length(title) between 1 and 500),
  author                text check (char_length(author) <= 500),
  pages                 integer check (pages > 0),
  cover_url             text check (cover_url ~ '^https://covers\.openlibrary\.org/'),
  summary               text check (char_length(summary) <= 20000),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create trigger books_set_updated_at
  before update on public.books
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- user_books: leitura de um livro por um usuário (uma por livro)
-- -----------------------------------------------------------------------------
create table public.user_books (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  book_id             uuid not null references public.books (id) on delete restrict,
  started_on          date not null,
  finished_on         date,
  rank_characters     smallint check (rank_characters between 1 and 5),
  rank_plot           smallint check (rank_plot between 1 and 5),
  rank_writing        smallint check (rank_writing between 1 and 5),
  rank_ending         smallint check (rank_ending between 1 and 5),
  favorite_character  text check (char_length(favorite_character) <= 200),
  favorite_quote      text check (char_length(favorite_quote) <= 2000),
  comment             text check (char_length(comment) <= 5000),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint user_books_user_book_unique unique (user_id, book_id),
  constraint user_books_dates_check check (finished_on is null or finished_on >= started_on)
);

create index user_books_book_id_idx on public.user_books (book_id);

create trigger user_books_set_updated_at
  before update on public.user_books
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- posts: itens do feed. Criados/removidos por trigger quando finished_on muda.
-- -----------------------------------------------------------------------------
create table public.posts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  user_book_id  uuid not null references public.user_books (id) on delete cascade,
  type          text not null default 'finished_reading' check (type in ('finished_reading')),
  created_at    timestamptz not null default now(),
  constraint posts_user_book_type_unique unique (user_book_id, type)
);

create index posts_feed_idx on public.posts (created_at desc, id desc);
create index posts_user_id_idx on public.posts (user_id);

-- -----------------------------------------------------------------------------
-- reading_list: "Quero ler" (sugestões aceitas). Sai da lista ao iniciar a leitura.
-- -----------------------------------------------------------------------------
create table public.reading_list (
  user_id     uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  book_id     uuid not null references public.books (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, book_id)
);

-- -----------------------------------------------------------------------------
-- clubs
-- -----------------------------------------------------------------------------
create table public.clubs (
  id           uuid primary key default gen_random_uuid(),
  name         text not null check (char_length(btrim(name)) between 1 and 80),
  cover_url    text check (char_length(cover_url) <= 1000),
  -- 6 caracteres sem ambíguos (sem 0/O, 1/I)
  invite_code  text not null unique check (invite_code ~ '^[A-HJ-NP-Z2-9]{6}$'),
  created_by   uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now()
);

create table public.club_members (
  club_id    uuid not null references public.clubs (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  role       text not null default 'member' check (role in ('owner', 'member')),
  joined_at  timestamptz not null default now(),
  primary key (club_id, user_id)
);

create index club_members_user_id_idx on public.club_members (user_id);

-- -----------------------------------------------------------------------------
-- club_books: pending → reading (todos aprovam) → finished; ou rejected
-- -----------------------------------------------------------------------------
create table public.club_books (
  id              uuid primary key default gen_random_uuid(),
  club_id         uuid not null references public.clubs (id) on delete cascade,
  book_id         uuid not null references public.books (id) on delete restrict,
  status          text not null default 'pending'
                    check (status in ('pending', 'reading', 'finished', 'rejected')),
  proposed_by     uuid references public.profiles (id) on delete set null,
  started_on      date,
  finished_on     date,
  edition_number  integer check (edition_number > 0),
  created_at      timestamptz not null default now(),
  constraint club_books_dates_check
    check (finished_on is null or started_on is null or finished_on >= started_on),
  constraint club_books_edition_unique unique (club_id, edition_number),
  constraint club_books_finished_has_edition
    check (status <> 'finished' or (edition_number is not null and finished_on is not null))
);

-- Um livro só pode estar ativo (pendente, em leitura ou concluído) uma vez por clube;
-- depois de rejeitado, pode ser proposto de novo.
create unique index club_books_active_unique
  on public.club_books (club_id, book_id)
  where status <> 'rejected';

create index club_books_club_status_idx on public.club_books (club_id, status);

create table public.club_book_votes (
  club_book_id  uuid not null references public.club_books (id) on delete cascade,
  user_id       uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  approved      boolean not null,
  voted_at      timestamptz not null default now(),
  primary key (club_book_id, user_id)
);

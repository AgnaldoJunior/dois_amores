-- =============================================================================
-- Redesenho "the bookside": perfil completo (usuário, frase, capa, meta, tema,
-- gostos, arquétipo do teste), favoritos, estantes próprias, formato da leitura,
-- seguidores, curtidas, comentários, notificações e agenda do clube.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Perfil
-- -----------------------------------------------------------------------------
alter table public.profiles
  add column username text unique check (username ~ '^[a-z0-9._]{3,30}$'),
  add column tagline text check (char_length(tagline) <= 120),
  add column cover_url text check (char_length(cover_url) <= 1000),
  add column reading_goal integer check (reading_goal between 1 and 1000),
  add column theme text not null default 'classica'
    check (theme in ('classica', 'epoca', 'madrugada', 'jardim', 'tinta', 'rosa', 'kraft', 'poesia')),
  add column show_followers boolean not null default true,
  add column favorite_genres text[] not null default '{}' check (cardinality(favorite_genres) <= 12),
  add column archetype text check (char_length(archetype) <= 40),
  add column onboarded_at timestamptz,
  add column notifications_seen_at timestamptz not null default now();

-- Quem já usava o app não passa pelo cadastro de perfil de novo.
update public.profiles set onboarded_at = created_at;

grant update (username, tagline, cover_url, reading_goal, theme, show_followers, favorite_genres,
              archetype, onboarded_at, notifications_seen_at)
  on public.profiles to authenticated;

-- -----------------------------------------------------------------------------
-- Formato da leitura (impresso, e-book ou audiobook)
-- -----------------------------------------------------------------------------
alter table public.user_books
  add column format text check (format in ('impresso', 'ebook', 'audiobook'));

grant insert (format), update (format) on public.user_books to authenticated;

-- -----------------------------------------------------------------------------
-- Favoritos: até 4 capas no perfil
-- -----------------------------------------------------------------------------
create table public.profile_favorites (
  user_id    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  position   smallint not null check (position between 1 and 4),
  book_id    uuid not null references public.books (id) on delete cascade,
  primary key (user_id, position),
  unique (user_id, book_id)
);

-- -----------------------------------------------------------------------------
-- Estantes próprias ("lista de praia"); lidos, lendo e quero ler são automáticas
-- -----------------------------------------------------------------------------
create table public.shelves (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  name        text not null check (char_length(btrim(name)) between 1 and 40),
  color       text not null default 'areia' check (color in ('vinho', 'rosa', 'areia', 'dourado', 'tinta')),
  created_at  timestamptz not null default now(),
  unique (user_id, name)
);

create table public.shelf_books (
  shelf_id  uuid not null references public.shelves (id) on delete cascade,
  book_id   uuid not null references public.books (id) on delete cascade,
  added_at  timestamptz not null default now(),
  primary key (shelf_id, book_id)
);

create index shelf_books_book_idx on public.shelf_books (book_id);

create or replace function public.owns_shelf(p_shelf_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.shelves where id = p_shelf_id and user_id = auth.uid());
$$;

-- -----------------------------------------------------------------------------
-- Seguidores, curtidas e comentários
-- -----------------------------------------------------------------------------
create table public.follows (
  follower_id  uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  followee_id  uuid not null references public.profiles (id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);

create index follows_followee_idx on public.follows (followee_id);

create table public.post_likes (
  post_id     uuid not null references public.posts (id) on delete cascade,
  user_id     uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table public.post_comments (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.posts (id) on delete cascade,
  user_id     uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body        text not null check (char_length(btrim(body)) between 1 and 1000),
  created_at  timestamptz not null default now()
);

create index post_comments_post_idx on public.post_comments (post_id, created_at);

-- -----------------------------------------------------------------------------
-- Clube: descrição, prazo da leitura da vez e agenda
-- -----------------------------------------------------------------------------
alter table public.clubs
  add column description text check (char_length(description) <= 300);

alter table public.club_books
  add column due_on date;

create table public.club_events (
  id          uuid primary key default gen_random_uuid(),
  club_id     uuid not null references public.clubs (id) on delete cascade,
  title       text not null check (char_length(btrim(title)) between 1 and 80),
  notes       text check (char_length(notes) <= 200),
  happens_on  date not null,
  created_by  uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now()
);

create index club_events_club_idx on public.club_events (club_id, happens_on);

-- Prazo da leitura da vez: qualquer membro ajusta.
create or replace function public.set_club_book_due(p_club_book_id uuid, p_due_on date)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  cb public.club_books;
begin
  select * into cb from public.club_books where id = p_club_book_id;
  if not found or not public.is_club_member(cb.club_id) then
    raise exception 'Livro não encontrado' using errcode = 'P0002';
  end if;
  if cb.status not in ('reading', 'queued') then
    raise exception 'Só livros em leitura ou na fila têm prazo' using errcode = '22023';
  end if;
  if p_due_on is not null and cb.started_on is not null and p_due_on < cb.started_on then
    raise exception 'O prazo termina antes do início' using errcode = '22023';
  end if;
  update public.club_books set due_on = p_due_on where id = cb.id;
end;
$$;

-- -----------------------------------------------------------------------------
-- Notificações: seguiram, curtiram ou comentaram uma ficha minha
-- -----------------------------------------------------------------------------
create or replace function public.my_notifications(p_limit integer default 50)
returns table (kind text, actor_id uuid, post_id uuid, body text, created_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select * from (
    select 'follow'::text, f.follower_id, null::uuid, null::text, f.created_at
    from public.follows f
    where f.followee_id = auth.uid()
    union all
    select 'like', l.user_id, l.post_id, null, l.created_at
    from public.post_likes l
    join public.posts p on p.id = l.post_id
    where p.user_id = auth.uid() and l.user_id <> auth.uid()
    union all
    select 'comment', c.user_id, c.post_id, left(c.body, 140), c.created_at
    from public.post_comments c
    join public.posts p on p.id = c.post_id
    where p.user_id = auth.uid() and c.user_id <> auth.uid()
  ) n (kind, actor_id, post_id, body, created_at)
  order by created_at desc
  limit least(greatest(p_limit, 1), 100);
$$;

-- -----------------------------------------------------------------------------
-- RLS e privilégios
-- -----------------------------------------------------------------------------
alter table public.profile_favorites enable row level security;
alter table public.shelves           enable row level security;
alter table public.shelf_books       enable row level security;
alter table public.follows           enable row level security;
alter table public.post_likes        enable row level security;
alter table public.post_comments     enable row level security;
alter table public.club_events       enable row level security;

grant select on public.profile_favorites, public.shelves, public.shelf_books, public.follows,
                public.post_likes, public.post_comments, public.club_events
  to authenticated;
grant insert (position, book_id), update (book_id), delete on public.profile_favorites to authenticated;
grant insert (name, color), update (name, color), delete on public.shelves to authenticated;
grant insert (shelf_id, book_id), delete on public.shelf_books to authenticated;
grant insert (followee_id), delete on public.follows to authenticated;
grant insert (post_id), delete on public.post_likes to authenticated;
grant insert (post_id, body), delete on public.post_comments to authenticated;
grant insert (club_id, title, notes, happens_on), delete on public.club_events to authenticated;
grant update (description) on public.clubs to authenticated;

grant execute on function
  public.owns_shelf(uuid),
  public.set_club_book_due(uuid, date),
  public.my_notifications(integer)
to authenticated;

-- Perfis, estantes, seguidores, curtidas e comentários são visíveis a quem usa o app
-- (como as leituras e o feed).
create policy "profile_favorites_select" on public.profile_favorites
  for select to authenticated using (true);
create policy "profile_favorites_write_own" on public.profile_favorites
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "shelves_select" on public.shelves
  for select to authenticated using (true);
create policy "shelves_write_own" on public.shelves
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "shelf_books_select" on public.shelf_books
  for select to authenticated using (true);
create policy "shelf_books_insert_own" on public.shelf_books
  for insert to authenticated with check (public.owns_shelf(shelf_id));
create policy "shelf_books_delete_own" on public.shelf_books
  for delete to authenticated using (public.owns_shelf(shelf_id));

create policy "follows_select" on public.follows
  for select to authenticated using (true);
create policy "follows_insert_own" on public.follows
  for insert to authenticated with check (follower_id = auth.uid());
create policy "follows_delete_own" on public.follows
  for delete to authenticated using (follower_id = auth.uid());

create policy "post_likes_select" on public.post_likes
  for select to authenticated using (true);
create policy "post_likes_insert_own" on public.post_likes
  for insert to authenticated with check (user_id = auth.uid());
create policy "post_likes_delete_own" on public.post_likes
  for delete to authenticated using (user_id = auth.uid());

create policy "post_comments_select" on public.post_comments
  for select to authenticated using (true);
create policy "post_comments_insert_own" on public.post_comments
  for insert to authenticated with check (user_id = auth.uid());
create policy "post_comments_delete_own_or_post_author" on public.post_comments
  for delete to authenticated
  using (user_id = auth.uid() or exists (select 1 from public.posts p where p.id = post_id and p.user_id = auth.uid()));

-- Agenda: só membros veem e criam; quem criou ou a dona apaga.
create policy "club_events_select_members" on public.club_events
  for select to authenticated using (public.is_club_member(club_id));
create policy "club_events_insert_members" on public.club_events
  for insert to authenticated with check (public.is_club_member(club_id) and created_by = auth.uid());
create policy "club_events_delete_own_or_owner" on public.club_events
  for delete to authenticated using (created_by = auth.uid() or public.is_club_owner(club_id));

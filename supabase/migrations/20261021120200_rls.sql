-- =============================================================================
-- Dois Amores · Row Level Security e privilégios
--
-- Visibilidade:
--   * perfis, livros, leituras e posts: qualquer usuário autenticado lê
--     (o feed é global e os resumos de membros mostram dados literários);
--   * "Quero ler": só o dono;
--   * clubes, membros, livros do clube e votos: só membros do clube.
-- Escrita: cada usuário só altera os próprios dados. Operações com regra de
-- negócio (catálogo, clubes, propostas, conclusão) passam por RPCs.
-- =============================================================================

alter table public.profiles        enable row level security;
alter table public.books           enable row level security;
alter table public.user_books      enable row level security;
alter table public.posts           enable row level security;
alter table public.reading_list    enable row level security;
alter table public.clubs           enable row level security;
alter table public.club_members    enable row level security;
alter table public.club_books      enable row level security;
alter table public.club_book_votes enable row level security;

-- -----------------------------------------------------------------------------
-- Privilégios: anon não acessa nada; authenticated só o necessário.
-- -----------------------------------------------------------------------------
revoke all on all tables in schema public from anon;
revoke all on all tables in schema public from authenticated;

grant select on all tables in schema public to authenticated;

grant update (name, avatar_url, bio) on public.profiles to authenticated;

grant insert (user_id, book_id, started_on, finished_on, rank_characters, rank_plot,
              rank_writing, rank_ending, favorite_character, favorite_quote, comment)
  on public.user_books to authenticated;
grant update (started_on, finished_on, rank_characters, rank_plot, rank_writing,
              rank_ending, favorite_character, favorite_quote, comment)
  on public.user_books to authenticated;
grant delete on public.user_books to authenticated;

grant insert (user_id, book_id), delete on public.reading_list to authenticated;

grant update (name, cover_url), delete on public.clubs to authenticated;
grant delete on public.club_members to authenticated;
grant delete on public.club_books to authenticated;

grant insert (club_book_id, user_id, approved) on public.club_book_votes to authenticated;
grant update (approved) on public.club_book_votes to authenticated;

-- Funções: ninguém executa por padrão; liberamos RPCs e helpers de RLS.
revoke execute on all functions in schema public from public, anon, authenticated;

grant execute on function
  public.upsert_book(text, text, text, integer, text, text),
  public.create_club(text, text),
  public.join_club(text),
  public.regenerate_invite_code(uuid),
  public.propose_club_book(uuid, uuid),
  public.finish_club_book(uuid, date),
  public.is_club_member(uuid),
  public.is_club_owner(uuid),
  public.can_vote_club_book(uuid)
to authenticated;

-- Novas tabelas/funções não ficam abertas por padrão.
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- profiles
-- -----------------------------------------------------------------------------
create policy "profiles_select_authenticated" on public.profiles
  for select to authenticated using (true);

create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- -----------------------------------------------------------------------------
-- books (escrita só via upsert_book)
-- -----------------------------------------------------------------------------
create policy "books_select_authenticated" on public.books
  for select to authenticated using (true);

-- -----------------------------------------------------------------------------
-- user_books
-- -----------------------------------------------------------------------------
create policy "user_books_select_authenticated" on public.user_books
  for select to authenticated using (true);

create policy "user_books_insert_own" on public.user_books
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "user_books_update_own" on public.user_books
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "user_books_delete_own" on public.user_books
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- -----------------------------------------------------------------------------
-- posts (escrita só via trigger)
-- -----------------------------------------------------------------------------
create policy "posts_select_authenticated" on public.posts
  for select to authenticated using (true);

-- -----------------------------------------------------------------------------
-- reading_list
-- -----------------------------------------------------------------------------
create policy "reading_list_select_own" on public.reading_list
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "reading_list_insert_own" on public.reading_list
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "reading_list_delete_own" on public.reading_list
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- -----------------------------------------------------------------------------
-- clubs (criação via create_club; código via regenerate_invite_code)
-- -----------------------------------------------------------------------------
create policy "clubs_select_members" on public.clubs
  for select to authenticated
  using (public.is_club_member(id));

create policy "clubs_update_owner" on public.clubs
  for update to authenticated
  using (public.is_club_owner(id))
  with check (public.is_club_owner(id));

create policy "clubs_delete_owner" on public.clubs
  for delete to authenticated
  using (public.is_club_owner(id));

-- -----------------------------------------------------------------------------
-- club_members (entrada via join_club)
-- Membro pode sair (exceto o dono); dono pode remover outros membros.
-- -----------------------------------------------------------------------------
create policy "club_members_select_members" on public.club_members
  for select to authenticated
  using (public.is_club_member(club_id));

create policy "club_members_delete_self_or_owner" on public.club_members
  for delete to authenticated
  using (
    (user_id = (select auth.uid()) and role <> 'owner')
    or (public.is_club_owner(club_id) and user_id <> (select auth.uid()))
  );

-- -----------------------------------------------------------------------------
-- club_books (proposta via propose_club_book; conclusão via finish_club_book)
-- Quem propôs pode retirar a proposta enquanto pendente.
-- -----------------------------------------------------------------------------
create policy "club_books_select_members" on public.club_books
  for select to authenticated
  using (public.is_club_member(club_id));

create policy "club_books_delete_own_pending" on public.club_books
  for delete to authenticated
  using (proposed_by = (select auth.uid()) and status = 'pending');

-- -----------------------------------------------------------------------------
-- club_book_votes
-- -----------------------------------------------------------------------------
create policy "club_book_votes_select_members" on public.club_book_votes
  for select to authenticated
  using (
    exists (
      select 1 from public.club_books cb
      where cb.id = club_book_id and public.is_club_member(cb.club_id)
    )
  );

create policy "club_book_votes_insert_own" on public.club_book_votes
  for insert to authenticated
  with check (user_id = (select auth.uid()) and public.can_vote_club_book(club_book_id));

create policy "club_book_votes_update_own" on public.club_book_votes
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and public.can_vote_club_book(club_book_id));

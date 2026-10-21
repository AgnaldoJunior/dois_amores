-- =============================================================================
-- Dois Amores · funções, triggers e RPCs
-- Todas as funções security definer usam search_path vazio e nomes qualificados.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Perfil criado no cadastro. Nome e foto vêm do provedor quando existirem
-- (Google envia full_name/name e avatar_url/picture).
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, name, avatar_url)
  values (
    new.id,
    left(
      coalesce(
        nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
        nullif(btrim(new.raw_user_meta_data ->> 'name'), ''),
        split_part(coalesce(new.email, ''), '@', 1)
      ),
      80
    ),
    coalesce(
      nullif(new.raw_user_meta_data ->> 'avatar_url', ''),
      nullif(new.raw_user_meta_data ->> 'picture', '')
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Post no feed ao concluir a leitura; removido se a data de fim for apagada.
-- -----------------------------------------------------------------------------
create or replace function public.sync_finished_post()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.finished_on is not null and (tg_op = 'INSERT' or old.finished_on is null) then
    insert into public.posts (user_id, user_book_id, type)
    values (new.user_id, new.id, 'finished_reading')
    on conflict (user_book_id, type) do nothing;
  elsif tg_op = 'UPDATE' and new.finished_on is null and old.finished_on is not null then
    delete from public.posts
    where user_book_id = new.id and type = 'finished_reading';
  end if;
  return new;
end;
$$;

create trigger user_books_sync_post
  after insert or update of finished_on on public.user_books
  for each row execute function public.sync_finished_post();

-- -----------------------------------------------------------------------------
-- Ao começar a ler um livro, ele sai da lista "Quero ler".
-- -----------------------------------------------------------------------------
create or replace function public.remove_started_from_reading_list()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.reading_list
  where user_id = new.user_id and book_id = new.book_id;
  return new;
end;
$$;

create trigger user_books_remove_from_reading_list
  after insert on public.user_books
  for each row execute function public.remove_started_from_reading_list();

-- -----------------------------------------------------------------------------
-- Catálogo: insere o livro da Open Library ou completa campos vazios.
-- -----------------------------------------------------------------------------
create or replace function public.upsert_book(
  p_work_key  text,
  p_title     text,
  p_author    text default null,
  p_pages     integer default null,
  p_cover_url text default null,
  p_summary   text default null
)
returns public.books
language plpgsql
security definer
set search_path = ''
as $$
declare
  result public.books;
begin
  if auth.uid() is null then
    raise exception 'Autenticação necessária' using errcode = '42501';
  end if;

  insert into public.books (openlibrary_work_key, title, author, pages, cover_url, summary)
  values (p_work_key, btrim(p_title), nullif(btrim(p_author), ''), p_pages,
          nullif(p_cover_url, ''), nullif(btrim(p_summary), ''))
  on conflict (openlibrary_work_key) do update set
    author    = coalesce(public.books.author, excluded.author),
    pages     = coalesce(public.books.pages, excluded.pages),
    cover_url = coalesce(public.books.cover_url, excluded.cover_url),
    summary   = coalesce(public.books.summary, excluded.summary)
  returning * into result;

  return result;
end;
$$;

-- -----------------------------------------------------------------------------
-- Clubes: helpers usados pelas políticas RLS (security definer evita recursão).
-- -----------------------------------------------------------------------------
create or replace function public.is_club_member(p_club_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.club_members
    where club_id = p_club_id and user_id = auth.uid()
  );
$$;

create or replace function public.is_club_owner(p_club_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.club_members
    where club_id = p_club_id and user_id = auth.uid() and role = 'owner'
  );
$$;

-- Pode votar quem já era membro quando o livro foi proposto, enquanto estiver pendente.
create or replace function public.can_vote_club_book(p_club_book_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.club_books cb
    join public.club_members m on m.club_id = cb.club_id
    where cb.id = p_club_book_id
      and cb.status = 'pending'
      and m.user_id = auth.uid()
      and m.joined_at <= cb.created_at
  );
$$;

create or replace function public.generate_invite_code()
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- 32 símbolos
  bytes bytea;
  code text;
begin
  loop
    bytes := extensions.gen_random_bytes(6);
    code := '';
    for i in 0..5 loop
      code := code || substr(alphabet, 1 + (get_byte(bytes, i) % 32), 1);
    end loop;
    exit when not exists (select 1 from public.clubs where invite_code = code);
  end loop;
  return code;
end;
$$;

create or replace function public.create_club(p_name text, p_cover_url text default null)
returns public.clubs
language plpgsql
security definer
set search_path = ''
as $$
declare
  club public.clubs;
begin
  if auth.uid() is null then
    raise exception 'Autenticação necessária' using errcode = '42501';
  end if;

  insert into public.clubs (name, cover_url, invite_code, created_by)
  values (btrim(p_name), nullif(p_cover_url, ''), public.generate_invite_code(), auth.uid())
  returning * into club;

  insert into public.club_members (club_id, user_id, role)
  values (club.id, auth.uid(), 'owner');

  return club;
end;
$$;

create or replace function public.join_club(p_code text)
returns public.clubs
language plpgsql
security definer
set search_path = ''
as $$
declare
  club public.clubs;
begin
  if auth.uid() is null then
    raise exception 'Autenticação necessária' using errcode = '42501';
  end if;

  select * into club
  from public.clubs
  where invite_code = upper(regexp_replace(coalesce(p_code, ''), '\s', '', 'g'));

  if not found then
    raise exception 'Código de convite inválido' using errcode = 'P0002';
  end if;

  insert into public.club_members (club_id, user_id, role)
  values (club.id, auth.uid(), 'member')
  on conflict (club_id, user_id) do nothing;

  return club;
end;
$$;

create or replace function public.regenerate_invite_code(p_club_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  code text;
begin
  if not public.is_club_owner(p_club_id) then
    raise exception 'Apenas quem criou o clube pode gerar um novo código' using errcode = '42501';
  end if;

  code := public.generate_invite_code();
  update public.clubs set invite_code = code where id = p_club_id;
  return code;
end;
$$;

-- -----------------------------------------------------------------------------
-- Aprovação de livros do clube.
-- Regra (espelhada em src/lib/domain/clubApproval.ts):
--   * votam os membros que já estavam no clube quando o livro foi proposto;
--   * uma reprovação → rejected;
--   * todos aprovaram → reading (início = hoje);
--   * caso contrário continua pending.
-- -----------------------------------------------------------------------------
create or replace function public.evaluate_club_book(p_club_book_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  cb public.club_books;
  eligible integer;
  approvals integer;
  rejections integer;
begin
  select * into cb from public.club_books where id = p_club_book_id for update;
  if not found or cb.status <> 'pending' then
    return;
  end if;

  select
    count(*),
    count(*) filter (where v.approved),
    count(*) filter (where not v.approved)
  into eligible, approvals, rejections
  from public.club_members m
  left join public.club_book_votes v
    on v.club_book_id = cb.id and v.user_id = m.user_id
  where m.club_id = cb.club_id
    and m.joined_at <= cb.created_at;

  if rejections > 0 then
    update public.club_books set status = 'rejected' where id = cb.id;
  elsif eligible > 0 and approvals = eligible then
    update public.club_books
    set status = 'reading', started_on = current_date
    where id = cb.id;
  end if;
end;
$$;

create or replace function public.on_club_book_vote()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.evaluate_club_book(new.club_book_id);
  return new;
end;
$$;

create trigger club_book_votes_evaluate
  after insert or update of approved on public.club_book_votes
  for each row execute function public.on_club_book_vote();

-- Se um membro sai, as propostas pendentes podem passar a ter aprovação unânime.
create or replace function public.on_club_member_removed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  pending_id uuid;
begin
  -- Clube sendo excluído (cascade): nada a reavaliar.
  if not exists (select 1 from public.clubs where id = old.club_id) then
    return old;
  end if;

  for pending_id in
    select id from public.club_books
    where club_id = old.club_id and status = 'pending'
  loop
    perform public.evaluate_club_book(pending_id);
  end loop;
  return old;
end;
$$;

create trigger club_members_reevaluate_pending
  after delete on public.club_members
  for each row execute function public.on_club_member_removed();

create or replace function public.propose_club_book(p_club_id uuid, p_book_id uuid)
returns public.club_books
language plpgsql
security definer
set search_path = ''
as $$
declare
  cb public.club_books;
begin
  if not public.is_club_member(p_club_id) then
    raise exception 'Você não participa deste clube' using errcode = '42501';
  end if;

  insert into public.club_books (club_id, book_id, proposed_by)
  values (p_club_id, p_book_id, auth.uid())
  returning * into cb;

  -- Quem propõe já aprova (o trigger reavalia o status).
  insert into public.club_book_votes (club_book_id, user_id, approved)
  values (cb.id, auth.uid(), true);

  select * into cb from public.club_books where id = cb.id;
  return cb;
end;
$$;

create or replace function public.finish_club_book(
  p_club_book_id uuid,
  p_finished_on date default current_date
)
returns public.club_books
language plpgsql
security definer
set search_path = ''
as $$
declare
  cb public.club_books;
begin
  select * into cb from public.club_books where id = p_club_book_id for update;

  if not found or not public.is_club_member(cb.club_id) then
    raise exception 'Livro não encontrado' using errcode = 'P0002';
  end if;
  if cb.status <> 'reading' then
    raise exception 'Só é possível concluir um livro em leitura' using errcode = '22023';
  end if;

  -- Serializa a numeração das edições dentro do clube.
  perform 1 from public.clubs where id = cb.club_id for update;

  update public.club_books
  set status = 'finished',
      finished_on = p_finished_on,
      edition_number = (
        select coalesce(max(edition_number), 0) + 1
        from public.club_books
        where club_id = cb.club_id
      )
  where id = cb.id
  returning * into cb;

  return cb;
end;
$$;

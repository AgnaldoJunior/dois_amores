-- =============================================================================
-- Progresso de leitura, bichinho do perfil e fila de próximas leituras do clube.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Página atual de uma leitura em andamento ("38% lido")
-- -----------------------------------------------------------------------------
alter table public.user_books
  add column current_page integer check (current_page >= 0);

grant insert (current_page) on public.user_books to authenticated;
grant update (current_page) on public.user_books to authenticated;

-- -----------------------------------------------------------------------------
-- Bichinho do perfil (um emoji): marca os livros que a pessoa escolheu no clube
-- -----------------------------------------------------------------------------
alter table public.profiles
  add column pet text check (char_length(pet) between 1 and 16);

grant update (pet) on public.profiles to authenticated;

-- -----------------------------------------------------------------------------
-- Fila do clube: aprovado enquanto outro livro está em leitura → queued.
-- Ao concluir a leitura atual, o mais antigo da fila entra em leitura.
-- pending → reading | queued → reading → finished; ou rejected
-- -----------------------------------------------------------------------------
alter table public.club_books drop constraint club_books_status_check;
alter table public.club_books
  add constraint club_books_status_check
  check (status in ('pending', 'queued', 'reading', 'finished', 'rejected'));

alter table public.club_books add column queued_at timestamptz;

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
    -- Serializa as aprovações do clube: só um livro em leitura por vez.
    perform 1 from public.clubs where id = cb.club_id for update;
    if exists (
      select 1 from public.club_books
      where club_id = cb.club_id and status = 'reading' and id <> cb.id
    ) then
      -- clock_timestamp(): a ordem da fila vale mesmo dentro de uma transação.
      update public.club_books
      set status = 'queued', queued_at = clock_timestamp()
      where id = cb.id;
    else
      update public.club_books
      set status = 'reading', started_on = current_date
      where id = cb.id;
    end if;
  end if;
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

  -- O próximo da fila começa no dia em que o anterior terminou.
  if not exists (select 1 from public.club_books where club_id = cb.club_id and status = 'reading') then
    update public.club_books
    set status = 'reading', started_on = p_finished_on
    where id = (
      select id from public.club_books
      where club_id = cb.club_id and status = 'queued'
      order by queued_at, created_at
      limit 1
    );
  end if;

  return cb;
end;
$$;

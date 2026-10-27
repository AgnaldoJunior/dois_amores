-- =============================================================================
-- IA: tradução de resumos e limite diário de uso.
--
-- books.summary passa a ser sempre o texto exibido (em português quando
-- possível). Quando a IA traduz, o original fica em summary_original e
-- summary_source = 'ai_translation' (a interface mostra "traduzido por IA").
-- summary_lang nulo = idioma ainda não verificado.
-- =============================================================================

alter table public.books
  add column summary_lang text check (summary_lang ~ '^[a-z]{2}$'),
  add column summary_source text not null default 'openlibrary'
    check (summary_source in ('openlibrary', 'ai_translation')),
  add column summary_original text check (char_length(summary_original) <= 20000);

-- Um resumo novo (upsert_book só preenche vazios) volta a ser "não verificado".
create or replace function public.reset_summary_language()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.summary is distinct from old.summary and new.summary_source = 'openlibrary' then
    new.summary_lang := null;
  end if;
  return new;
end;
$$;

create trigger books_reset_summary_language
  before update of summary on public.books
  for each row execute function public.reset_summary_language();

-- -----------------------------------------------------------------------------
-- Uso da IA por pessoa e por dia. Só a Edge Function (service_role) escreve.
-- -----------------------------------------------------------------------------
create table public.ai_usage (
  user_id  uuid not null references public.profiles (id) on delete cascade,
  day      date not null default current_date,
  calls    integer not null default 0 check (calls >= 0),
  primary key (user_id, day)
);

alter table public.ai_usage enable row level security;
revoke all on public.ai_usage from anon, authenticated;
grant select on public.ai_usage to authenticated;

create policy "ai_usage_select_own" on public.ai_usage
  for select to authenticated
  using (user_id = (select auth.uid()));

-- Consome uma chamada do limite diário; devolve false quando o limite acabou.
create or replace function public.consume_ai_quota(p_user_id uuid, p_limit integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  used integer;
begin
  insert into public.ai_usage as u (user_id, day, calls)
  values (p_user_id, current_date, 1)
  on conflict (user_id, day) do update
    set calls = u.calls + 1
    where u.calls < p_limit
  returning u.calls into used;

  return used is not null;
end;
$$;

revoke execute on function public.consume_ai_quota(uuid, integer) from public, anon, authenticated;
grant execute on function public.consume_ai_quota(uuid, integer) to service_role;

-- Devolve a chamada quando a IA falhou (a pessoa não perde cota por erro do provedor).
create or replace function public.refund_ai_quota(p_user_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.ai_usage
  set calls = calls - 1
  where user_id = p_user_id and day = current_date and calls > 0;
$$;

revoke execute on function public.refund_ai_quota(uuid) from public, anon, authenticated;
grant execute on function public.refund_ai_quota(uuid) to service_role;

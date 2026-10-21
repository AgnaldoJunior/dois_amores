-- Clubes: criação, convite, visibilidade, propostas, votos e edições.
begin;
create extension if not exists pgtap with schema extensions;

select plan(30);

insert into auth.users (id, email, raw_user_meta_data) values
  ('cccccccc-0000-4000-8000-000000000001', 'dona@test.local',    '{"full_name": "Dona"}'),
  ('cccccccc-0000-4000-8000-000000000002', 'membro@test.local',  '{"full_name": "Membro"}'),
  ('cccccccc-0000-4000-8000-000000000003', 'novata@test.local',  '{"full_name": "Novata"}'),
  ('cccccccc-0000-4000-8000-000000000004', 'estranha@test.local','{"full_name": "Estranha"}');

insert into public.books (id, openlibrary_work_key, title) values
  ('dddddddd-0000-4000-8000-000000000001', '/works/OL888001W', 'Livro A'),
  ('dddddddd-0000-4000-8000-000000000002', '/works/OL888002W', 'Livro B'),
  ('dddddddd-0000-4000-8000-000000000003', '/works/OL888003W', 'Livro C'),
  ('dddddddd-0000-4000-8000-000000000004', '/works/OL888004W', 'Livro D');

-- Variáveis de teste (tabela temporária acessível a todos os papéis)
create temporary table t (key text primary key, value text);
grant all on t to authenticated;

-- Dona cria o clube ----------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims to '{"sub": "cccccccc-0000-4000-8000-000000000001", "role": "authenticated"}';

select throws_ok(
  $$ insert into public.clubs (name, invite_code) values ('Direto', 'ABCDEF') $$,
  '42501', null,
  'clube só é criado via create_club'
);

insert into t select 'club', (public.create_club('  Clube de Teste  ')).id::text;

select is(
  (select name from public.clubs where id = (select value::uuid from t where key = 'club')),
  'Clube de Teste',
  'create_club cria o clube (nome sem espaços extras)'
);
select matches(
  (select invite_code from public.clubs where id = (select value::uuid from t where key = 'club')),
  '^[A-HJ-NP-Z2-9]{6}$',
  'código de convite tem 6 caracteres sem ambíguos'
);
select is(
  (select role from public.club_members
   where club_id = (select value::uuid from t where key = 'club')
     and user_id = 'cccccccc-0000-4000-8000-000000000001'),
  'owner',
  'quem cria vira dona do clube'
);

insert into t select 'code', invite_code from public.clubs where id = (select value::uuid from t where key = 'club');

-- Estranha não vê nada ----------------------------------------------------------------
set local request.jwt.claims to '{"sub": "cccccccc-0000-4000-8000-000000000004", "role": "authenticated"}';
select is((select count(*)::int from public.clubs where id = (select value::uuid from t where key = 'club')), 0,
  'quem não é membro não vê o clube');
select is((select count(*)::int from public.club_members where club_id = (select value::uuid from t where key = 'club')), 0,
  'quem não é membro não vê os membros');
select throws_ok(
  $$ select public.join_club('ZZZZZZ') $$,
  'P0002', 'Código de convite inválido',
  'código inexistente é recusado'
);

-- Membro entra com o código (minúsculo e com espaços) ---------------------------------------
set local request.jwt.claims to '{"sub": "cccccccc-0000-4000-8000-000000000002", "role": "authenticated"}';
select lives_ok(
  format($$ select public.join_club(%L) $$,
         ' ' || lower(substr((select value from t where key = 'code'), 1, 3)) || ' '
             || lower(substr((select value from t where key = 'code'), 4, 3))),
  'join_club aceita o código digitado com espaços e minúsculas'
);
select lives_ok(
  format($$ select public.join_club(%L) $$, (select value from t where key = 'code')),
  'entrar duas vezes não falha'
);
select is(
  (select count(*)::int from public.club_members where club_id = (select value::uuid from t where key = 'club')),
  2,
  'membro passa a ver os membros do clube'
);

update public.clubs set name = 'Tomado' where id = (select value::uuid from t where key = 'club');
select is((select name from public.clubs where id = (select value::uuid from t where key = 'club')), 'Clube de Teste',
  'membro comum não renomeia o clube');
select throws_ok(
  format($$ select public.regenerate_invite_code(%L) $$, (select value from t where key = 'club')),
  '42501', null,
  'membro comum não gera novo código'
);

-- Proposta 1: aprovada por todos --------------------------------------------------------------
set local request.jwt.claims to '{"sub": "cccccccc-0000-4000-8000-000000000001", "role": "authenticated"}';
insert into t select 'cb1', (public.propose_club_book((select value::uuid from t where key = 'club'),
                                                       'dddddddd-0000-4000-8000-000000000001')).id::text;
select is((select status from public.club_books where id = (select value::uuid from t where key = 'cb1')), 'pending',
  'livro proposto fica pendente');
select is((select count(*)::int from public.club_book_votes where club_book_id = (select value::uuid from t where key = 'cb1')), 1,
  'quem propõe já aprova');

set local request.jwt.claims to '{"sub": "cccccccc-0000-4000-8000-000000000004", "role": "authenticated"}';
select throws_ok(
  format($$ insert into public.club_book_votes (club_book_id, approved) values (%L, true) $$,
         (select value from t where key = 'cb1')),
  '42501', null,
  'quem não é membro não vota'
);

set local request.jwt.claims to '{"sub": "cccccccc-0000-4000-8000-000000000002", "role": "authenticated"}';
insert into public.club_book_votes (club_book_id, approved) values ((select value::uuid from t where key = 'cb1'), true);
select results_eq(
  format($$ select status, started_on from public.club_books where id = %L $$, (select value from t where key = 'cb1')),
  $$ values ('reading'::text, current_date) $$,
  'com todos aprovando, o livro entra no clube (em leitura, início hoje)'
);
select throws_ok(
  format($$ update public.club_book_votes set approved = false where club_book_id = %L $$, (select value from t where key = 'cb1')),
  '42501', null,
  'não muda o voto depois que o livro saiu de pendente'
);

-- Proposta 2: uma reprovação ------------------------------------------------------------------
insert into t select 'cb2', (public.propose_club_book((select value::uuid from t where key = 'club'),
                                                       'dddddddd-0000-4000-8000-000000000002')).id::text;
set local request.jwt.claims to '{"sub": "cccccccc-0000-4000-8000-000000000001", "role": "authenticated"}';
insert into public.club_book_votes (club_book_id, approved) values ((select value::uuid from t where key = 'cb2'), false);
select is((select status from public.club_books where id = (select value::uuid from t where key = 'cb2')), 'rejected',
  'uma reprovação rejeita o livro');
select lives_ok(
  $$ select public.propose_club_book((select value::uuid from t where key = 'club'), 'dddddddd-0000-4000-8000-000000000002') $$,
  'livro rejeitado pode ser proposto de novo'
);
select throws_ok(
  $$ select public.propose_club_book((select value::uuid from t where key = 'club'), 'dddddddd-0000-4000-8000-000000000001') $$,
  '23505', null,
  'livro já ativo no clube não é proposto em duplicidade'
);

-- Proposta 3: Novata entra depois e não conta ---------------------------------------------------
insert into t select 'cb3', (public.propose_club_book((select value::uuid from t where key = 'club'),
                                                       'dddddddd-0000-4000-8000-000000000003')).id::text;
set local request.jwt.claims to '{"sub": "cccccccc-0000-4000-8000-000000000003", "role": "authenticated"}';
select public.join_club((select value from t where key = 'code'));

-- now() é fixo dentro da transação: simulamos a entrada posterior.
reset role;
update public.club_members set joined_at = now() + interval '1 minute'
where user_id = 'cccccccc-0000-4000-8000-000000000003';
set local role authenticated;

select throws_ok(
  format($$ insert into public.club_book_votes (club_book_id, approved) values (%L, false) $$,
         (select value from t where key = 'cb3')),
  '42501', null,
  'quem entrou depois da proposta não vota nela'
);

set local request.jwt.claims to '{"sub": "cccccccc-0000-4000-8000-000000000002", "role": "authenticated"}';
insert into public.club_book_votes (club_book_id, approved) values ((select value::uuid from t where key = 'cb3'), true);
select is((select status from public.club_books where id = (select value::uuid from t where key = 'cb3')), 'reading',
  'aprovação considera só quem era membro na proposta');

-- Proposta 4: saída de membro reavalia pendências -------------------------------------------------
-- Novata passa a ser elegível para as próximas propostas.
reset role;
update public.club_members set joined_at = now() - interval '1 minute'
where user_id = 'cccccccc-0000-4000-8000-000000000003';
set local role authenticated;
set local request.jwt.claims to '{"sub": "cccccccc-0000-4000-8000-000000000001", "role": "authenticated"}';
insert into t select 'cb4', (public.propose_club_book((select value::uuid from t where key = 'club'),
                                                       'dddddddd-0000-4000-8000-000000000004')).id::text;
-- Membro e Novata precisam votar; Novata vota, Membro sai sem votar.
set local request.jwt.claims to '{"sub": "cccccccc-0000-4000-8000-000000000003", "role": "authenticated"}';
insert into public.club_book_votes (club_book_id, approved) values ((select value::uuid from t where key = 'cb4'), true);
select is((select status from public.club_books where id = (select value::uuid from t where key = 'cb4')), 'pending',
  'continua pendente enquanto falta voto');

set local request.jwt.claims to '{"sub": "cccccccc-0000-4000-8000-000000000002", "role": "authenticated"}';
delete from public.club_members where user_id = 'cccccccc-0000-4000-8000-000000000002';
set local request.jwt.claims to '{"sub": "cccccccc-0000-4000-8000-000000000001", "role": "authenticated"}';
select is((select status from public.club_books where id = (select value::uuid from t where key = 'cb4')), 'reading',
  'quando quem faltava sai do clube, a proposta é reavaliada');

-- Conclusão e numeração das edições ---------------------------------------------------------------
select is(
  (public.finish_club_book((select value::uuid from t where key = 'cb1'), current_date + 1)).edition_number,
  1,
  'primeiro livro concluído é a edição 1'
);
select is(
  (public.finish_club_book((select value::uuid from t where key = 'cb3'))).edition_number,
  2,
  'segundo livro concluído é a edição 2'
);
select throws_ok(
  format($$ select public.finish_club_book(%L) $$, (select value from t where key = 'cb1')),
  '22023', null,
  'não conclui duas vezes'
);

-- Dona não sai; dona remove membros; dona exclui o clube --------------------------------------------
delete from public.club_members where user_id = 'cccccccc-0000-4000-8000-000000000001';
select is(
  (select count(*)::int from public.club_members
   where club_id = (select value::uuid from t where key = 'club') and role = 'owner'),
  1,
  'a dona não pode sair do próprio clube'
);

delete from public.club_members where user_id = 'cccccccc-0000-4000-8000-000000000003';
select is(
  (select count(*)::int from public.club_members where club_id = (select value::uuid from t where key = 'club')),
  1,
  'a dona remove outros membros'
);

select lives_ok(
  format($$ delete from public.clubs where id = %L $$, (select value from t where key = 'club')),
  'a dona exclui o clube (cascata sem erros)'
);

select * from finish();
rollback;

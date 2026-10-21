-- Storage: cada usuário escreve só na própria pasta de avatars; capa do clube só pela dona.
begin;
create extension if not exists pgtap with schema extensions;

select plan(6);

insert into auth.users (id, email) values
  ('eeeeeeee-0000-4000-8000-000000000001', 'um@test.local'),
  ('eeeeeeee-0000-4000-8000-000000000002', 'dois@test.local');

select is(
  (select array_agg(id order by id) from storage.buckets where id in ('avatars', 'club-covers')),
  array['avatars', 'club-covers']::text[],
  'buckets avatars e club-covers existem'
);

set local role authenticated;
set local request.jwt.claims to '{"sub": "eeeeeeee-0000-4000-8000-000000000001", "role": "authenticated"}';

select lives_ok(
  $$ insert into storage.objects (bucket_id, name) values ('avatars', 'eeeeeeee-0000-4000-8000-000000000001/avatar.jpg') $$,
  'usuário envia avatar na própria pasta'
);
select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('avatars', 'eeeeeeee-0000-4000-8000-000000000002/avatar.jpg') $$,
  '42501', null,
  'usuário não escreve na pasta de outra pessoa'
);

create temporary table t (club uuid);
insert into t select (public.create_club('Clube Storage')).id;

select lives_ok(
  $$ insert into storage.objects (bucket_id, name) select 'club-covers', club::text || '/capa.jpg' from t $$,
  'dona envia a capa do clube'
);

set local request.jwt.claims to '{"sub": "eeeeeeee-0000-4000-8000-000000000002", "role": "authenticated"}';
select throws_ok(
  $$ insert into storage.objects (bucket_id, name) select 'club-covers', club::text || '/outra.jpg' from t $$,
  '42501', null,
  'quem não é dona não envia capa do clube'
);
select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('club-covers', 'nao-e-uuid/capa.jpg') $$,
  '42501', null,
  'caminho inválido é recusado sem erro de conversão'
);

select * from finish();
rollback;

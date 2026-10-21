-- =============================================================================
-- Dados de exemplo (somente ambiente local: `npm run db:reset`)
-- Clube "Dois Amores" · Leyna, Irla, Wanessa e Thaís · edições de maio a outubro de 2026
-- Login local: <nome>@example.com / senha: dois-amores
--
-- Citações favoritas ficam vazias de propósito: não inventamos trechos de livros reais.
-- Alguns campos vazios também exercitam os estados vazios da interface e do PDF.
-- =============================================================================

-- Usuários ---------------------------------------------------------------------
with seed_users (id, email, name) as (
  values
    ('10000000-0000-4000-8000-000000000001'::uuid, 'leyna@example.com',   'Leyna'),
    ('10000000-0000-4000-8000-000000000002'::uuid, 'irla@example.com',    'Irla'),
    ('10000000-0000-4000-8000-000000000003'::uuid, 'wanessa@example.com', 'Wanessa'),
    ('10000000-0000-4000-8000-000000000004'::uuid, 'thais@example.com',   'Thaís')
)
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
)
select
  '00000000-0000-0000-0000-000000000000', id, 'authenticated', 'authenticated', email,
  extensions.crypt('dois-amores', extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', jsonb_build_object('full_name', name),
  '2026-04-15', '2026-04-15', '', '', '', ''
from seed_users;

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), id, id::text,
       jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true),
       'email', now(), now(), now()
from auth.users
where email like '%@example.com';

update public.profiles set bio = case name
  when 'Leyna'   then 'Lê de tudo, mas tem um fraco por finais que doem.'
  when 'Irla'    then 'Sublinha, dobra a página e anota nas margens.'
  when 'Wanessa' then 'Suspense, fantasia e um bom drama familiar.'
  when 'Thaís'   then 'Clássicos brasileiros e romances de verão.'
end;

-- Livros (Open Library) -------------------------------------------------------
insert into public.books (id, openlibrary_work_key, title, author, pages, cover_url) values
  ('b0000000-0000-4000-8000-000000000001', '/works/OL38075794W', 'Tudo é rio',                     'Carla Madeira',        213, 'https://covers.openlibrary.org/b/id/14631316-L.jpg'),
  ('b0000000-0000-4000-8000-000000000002', '/works/OL21464434W', 'A cabeça do santo',              'Socorro Acioli',       192, 'https://covers.openlibrary.org/b/id/10373791-L.jpg'),
  ('b0000000-0000-4000-8000-000000000003', '/works/OL102360W',   'Eu que nunca conheci os homens', 'Jacqueline Harpman',   208, 'https://covers.openlibrary.org/b/id/7487522-L.jpg'),
  ('b0000000-0000-4000-8000-000000000004', '/works/OL29211540W', 'O massacre da família Hope',     'Riley Sager',          383, 'https://covers.openlibrary.org/b/id/13189306-L.jpg'),
  ('b0000000-0000-4000-8000-000000000005', '/works/OL25377714W', 'Três',                           'Valérie Perrin',       672, 'https://covers.openlibrary.org/b/id/12019565-L.jpg'),
  ('b0000000-0000-4000-8000-000000000006', '/works/OL43426400W', 'Amanhecer na colheita',          'Suzanne Collins',      400, 'https://covers.openlibrary.org/b/id/14847912-L.jpg'),
  ('b0000000-0000-4000-8000-000000000007', '/works/OL24141556W', 'Torto arado',                    'Itamar Vieira Junior', 280, 'https://covers.openlibrary.org/b/id/12369648-L.jpg'),
  ('b0000000-0000-4000-8000-000000000008', '/works/OL1002120W',  'A hora da estrela',              'Clarice Lispector',     96, 'https://covers.openlibrary.org/b/id/650866-L.jpg'),
  ('b0000000-0000-4000-8000-000000000009', '/works/OL20965973W', 'A biblioteca da meia-noite',     'Matt Haig',            304, 'https://covers.openlibrary.org/b/id/10313767-L.jpg'),
  ('b0000000-0000-4000-8000-000000000010', '/works/OL20068530W', 'Verity',                         'Colleen Hoover',       340, 'https://covers.openlibrary.org/b/id/8747160-L.jpg'),
  ('b0000000-0000-4000-8000-000000000011', '/works/OL27963555W', 'O avesso da pele',               'Jeferson Tenório',    null, 'https://covers.openlibrary.org/b/id/12769862-L.jpg'),
  ('b0000000-0000-4000-8000-000000000012', '/works/OL29226517W', 'Quarta asa',                     'Rebecca Yarros',       518, 'https://covers.openlibrary.org/b/id/14407898-L.jpg'),
  ('b0000000-0000-4000-8000-000000000013', '/works/OL675783W',   'O conto da aia',                 'Margaret Atwood',      352, null),
  ('b0000000-0000-4000-8000-000000000014', '/works/OL19849088W', 'Água fresca para as flores',     'Valérie Perrin',       555, 'https://covers.openlibrary.org/b/id/8647724-L.jpg');

-- Clube -----------------------------------------------------------------------
insert into public.clubs (id, name, invite_code, created_by, created_at) values
  ('c0000000-0000-4000-8000-000000000001', 'Dois Amores', 'DAMS26',
   '10000000-0000-4000-8000-000000000001', '2026-04-20 10:00-03');

insert into public.club_members (club_id, user_id, role, joined_at) values
  ('c0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'owner',  '2026-04-20 10:00-03'),
  ('c0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002', 'member', '2026-04-20 18:30-03'),
  ('c0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000003', 'member', '2026-04-21 09:15-03'),
  ('c0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000004', 'member', '2026-04-21 21:40-03');

-- Edições concluídas (maio a outubro)
insert into public.club_books (club_id, book_id, status, proposed_by, started_on, finished_on, edition_number, created_at)
values
  ('c0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'finished', '10000000-0000-4000-8000-000000000001', '2026-05-01', '2026-05-28', 1, '2026-04-25 12:00-03'),
  ('c0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000002', 'finished', '10000000-0000-4000-8000-000000000002', '2026-06-01', '2026-06-27', 2, '2026-05-26 12:00-03'),
  ('c0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000003', 'finished', '10000000-0000-4000-8000-000000000004', '2026-07-01', '2026-07-25', 3, '2026-06-24 12:00-03'),
  ('c0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000004', 'finished', '10000000-0000-4000-8000-000000000003', '2026-08-01', '2026-08-30', 4, '2026-07-27 12:00-03'),
  ('c0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000005', 'finished', '10000000-0000-4000-8000-000000000001', '2026-09-01', '2026-09-29', 5, '2026-08-28 12:00-03'),
  ('c0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000006', 'finished', '10000000-0000-4000-8000-000000000003', '2026-10-01', '2026-10-18', 6, '2026-09-27 12:00-03');

-- Proposta pendente: Wanessa propôs, 3 de 4 aprovaram (falta Thaís)
insert into public.club_books (id, club_id, book_id, status, proposed_by, created_at) values
  ('cb000000-0000-4000-8000-000000000007', 'c0000000-0000-4000-8000-000000000001',
   'b0000000-0000-4000-8000-000000000007', 'pending', '10000000-0000-4000-8000-000000000003', '2026-10-19 20:00-03');

insert into public.club_book_votes (club_book_id, user_id, approved, voted_at) values
  ('cb000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000003', true, '2026-10-19 20:00-03'),
  ('cb000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000001', true, '2026-10-19 21:12-03'),
  ('cb000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000002', true, '2026-10-20 08:05-03');

-- Leituras ----------------------------------------------------------------------
-- (pessoa, livro, início, fim, personagens, plot, escrita, final, personagem favorito, comentário)
with r (who, book, started_on, finished_on, c, p, w, e, fav, comment) as (
  values
    -- 1 · Tudo é rio (maio)
    ('Leyna',   1, '2026-05-01', '2026-05-20', 5, 5, 5, 4, 'Dalva',    'Um soco no estômago escrito com delicadeza.'),
    ('Irla',    1, '2026-05-02', '2026-05-26', 4, 4, 5, 4, 'Lucy',     'Sublinhei metade do livro.'),
    ('Wanessa', 1, '2026-05-03', '2026-05-28', 4, 3, 4, 3, 'Venâncio', 'Pesado, mas impossível de largar.'),
    ('Thaís',   1, '2026-05-01', '2026-05-18', 5, 4, 5, 5, 'Dalva',    null),
    -- 2 · A cabeça do santo (junho)
    ('Leyna',   2, '2026-06-01', '2026-06-21', 4, 4, 4, 4, 'Samuel',   'Leve, engraçado e cheio de fé.'),
    ('Irla',    2, '2026-06-02', '2026-06-25', 4, 3, 4, 3, null,       'Gostei do clima de cidade pequena.'),
    ('Wanessa', 2, '2026-06-01', '2026-06-27', 3, 3, 4, 2, 'Samuel',   'Bonita, mas demorei para entrar.'),
    ('Thaís',   2, '2026-06-05', '2026-06-26', 5, 4, 5, 4, 'Samuel',   'Me fez querer conhecer o Ceará.'),
    -- 3 · Eu que nunca conheci os homens (julho) — Thaís não terminou
    ('Leyna',   3, '2026-07-01', '2026-07-14', 5, 4, 5, 5, 'A narradora', 'Fiquei dias pensando nesse final.'),
    ('Irla',    3, '2026-07-01', '2026-07-22', 5, 5, 4, 5, 'A narradora', 'Uma leitura que pede pausa.'),
    ('Wanessa', 3, '2026-07-03', '2026-07-25', 4, 4, 4, 3, null,          null),
    ('Thaís',   3, '2026-07-02', null,         null, null, null, null, null, null),
    -- 4 · O massacre da família Hope (agosto)
    ('Leyna',   4, '2026-08-01', '2026-08-19', 4, 5, 3, 4, 'Kit McDeere',  'Virei a noite para terminar.'),
    ('Irla',    4, '2026-08-04', '2026-08-30', 3, 4, 3, 3, 'Lenora Hope',  null),
    ('Wanessa', 4, '2026-08-01', '2026-08-12', 5, 5, 4, 5, 'Lenora Hope',  'O meu tipo favorito de suspense.'),
    ('Thaís',   4, '2026-08-02', '2026-08-28', 3, 3, 3, 2, 'Kit McDeere',  'Adivinhei o final cedo demais.'),
    -- 5 · Três (setembro)
    ('Leyna',   5, '2026-09-01', '2026-09-27', 5, 4, 5, 4, 'Nina',     'Me acompanhou por dias, e o final ficou comigo.'),
    ('Irla',    5, '2026-09-01', '2026-09-29', 5, 5, 5, 4, 'Étienne',  'Longo, mas cada página vale.'),
    ('Wanessa', 5, '2026-09-02', '2026-09-28', 4, 4, 4, 3, 'Adrien',   'Os três amigos parecem gente de verdade.'),
    ('Thaís',   5, '2026-09-03', '2026-09-29', 5, 5, 4, 5, 'Virginie', 'Chorei no capítulo final.'),
    -- 6 · Amanhecer na colheita (outubro)
    ('Leyna',   6, '2026-10-01', '2026-10-12', 4, 5, 4, 5, 'Haymitch Abernathy', 'Doeu do jeito certo.'),
    ('Irla',    6, '2026-10-01', '2026-10-17', 4, 4, 4, 4, 'Maysilee Donner',    null),
    ('Wanessa', 6, '2026-10-02', '2026-10-09', 5, 5, 4, 5, 'Haymitch Abernathy', 'Melhor livro da série depois do primeiro.'),
    ('Thaís',   6, '2026-10-01', '2026-10-18', 4, 4, 3, 4, 'Lenore Dove',        'Gostei, mas esperava mais do meio.'),
    -- Enquanto isso, fora do clube…
    ('Leyna',   9,  '2026-06-03', '2026-06-15', 4, 4, 4, 5, null, 'Perfeito para uma semana difícil.'),
    ('Leyna',   14, '2026-08-05', '2026-08-29', 5, 4, 5, 5, 'Violette', 'Agora entendi por que todo mundo ama.'),
    ('Leyna',   8,  '2026-10-10', null,         null, null, null, null, null, null),
    ('Irla',    11, '2026-05-05', '2026-05-19', 5, 4, 5, 4, null, 'Necessário.'),
    ('Irla',    13, '2026-07-10', '2026-07-31', 5, 5, 5, 4, 'June', null),
    ('Irla',    12, '2026-09-05', '2026-09-24', 3, 4, 3, 4, null, 'Divertido, mas não é para mim.'),
    ('Wanessa', 10, '2026-06-10', '2026-06-14', 3, 5, 3, 5, null, 'Que final!'),
    ('Wanessa', 12, '2026-08-13', '2026-08-26', 5, 5, 4, 4, 'Xaden', 'Já quero o próximo.'),
    ('Wanessa', 9,  '2026-10-11', null,         null, null, null, null, null, null),
    ('Thaís',   8,  '2026-05-20', '2026-05-24', 5, 3, 5, 4, 'Macabéa', 'Curto e enorme ao mesmo tempo.'),
    ('Thaís',   13, '2026-09-01', '2026-09-20', 4, 5, 4, 3, null, null),
    ('Thaís',   14, '2026-10-12', null,         null, null, null, null, null, null)
)
insert into public.user_books (
  user_id, book_id, started_on, finished_on,
  rank_characters, rank_plot, rank_writing, rank_ending, favorite_character, comment
)
select
  p.id,
  ('b0000000-0000-4000-8000-' || lpad(r.book::text, 12, '0'))::uuid,
  r.started_on::date, r.finished_on::date,
  r.c, r.p, r.w, r.e, r.fav, r.comment
from r
join public.profiles p on p.name = r.who;

-- Posts criados pelo trigger recebem a data de conclusão (ordem realista no feed).
update public.posts po
set created_at = (ub.finished_on + time '20:00') at time zone 'America/Sao_Paulo'
from public.user_books ub
where ub.id = po.user_book_id;

-- "Quero ler"
insert into public.reading_list (user_id, book_id, created_at) values
  ('10000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000012', '2026-10-15 22:00-03'),
  ('10000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000011', '2026-10-16 22:00-03');

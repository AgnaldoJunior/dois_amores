-- Dados de exemplo do redesenho (perfil completo, seguidores, estantes, curtidas, agenda).
update public.profiles set
  username = lower(translate(name, 'í', 'i')) || '.le',
  tagline = case name
    when 'Leyna'   then 'gosto de finais que doem'
    when 'Irla'    then 'a leitura dela sempre volta para o que ficou aberto'
    when 'Wanessa' then 'um marcador é só a promessa de voltar'
    when 'Thaís'   then 'leio com café e chuva lá fora'
  end,
  reading_goal = case name when 'Leyna' then 24 when 'Irla' then 40 when 'Wanessa' then 30 when 'Thaís' then 12 end,
  theme = case name when 'Leyna' then 'classica' when 'Irla' then 'madrugada' when 'Wanessa' then 'rosa' when 'Thaís' then 'jardim' end,
  favorite_genres = array['romance', 'suspense', 'clássicos'],
  archetype = case name when 'Leyna' then 'coruja' when 'Irla' then 'contemplativa' end
where name in ('Leyna', 'Irla', 'Wanessa', 'Thaís');

insert into public.follows (follower_id, followee_id)
select a.id, b.id from public.profiles a, public.profiles b
where a.name in ('Leyna', 'Irla', 'Wanessa', 'Thaís') and b.name in ('Leyna', 'Irla', 'Wanessa', 'Thaís') and a.id <> b.id
on conflict do nothing;

insert into public.profile_favorites (user_id, position, book_id)
select p.id, f.pos, ('b0000000-0000-4000-8000-' || lpad(f.book::text, 12, '0'))::uuid
from public.profiles p
join (values (1, 5), (2, 3), (3, 14), (4, 9)) f (pos, book) on true
where p.name = 'Leyna'
on conflict do nothing;

insert into public.shelves (id, user_id, name, color)
select 'e0000000-0000-4000-8000-000000000001', id, 'lista de praia', 'rosa' from public.profiles where name = 'Leyna'
on conflict do nothing;
insert into public.shelf_books (shelf_id, book_id) values
  ('e0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000012'),
  ('e0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000010')
on conflict do nothing;

update public.user_books ub set format = 'audiobook'
from public.profiles p
where p.id = ub.user_id and p.name = 'Leyna' and ub.book_id = 'b0000000-0000-4000-8000-000000000009';

insert into public.post_likes (post_id, user_id)
select po.id, liker.id
from public.posts po
join public.profiles author on author.id = po.user_id and author.name = 'Leyna'
join public.profiles liker on liker.name in ('Irla', 'Thaís')
on conflict do nothing;

insert into public.post_comments (post_id, user_id, body, created_at)
select po.id, c.id, 'eu também não superei esse final 😭', po.created_at + interval '2 hours'
from public.posts po
join public.user_books ub on ub.id = po.user_book_id and ub.book_id = 'b0000000-0000-4000-8000-000000000005'
join public.profiles a on a.id = po.user_id and a.name = 'Leyna'
join public.profiles c on c.name = 'Wanessa';

update public.clubs set description = 'a gente lê com calma e se conta tudo depois ♡'
where id = 'c0000000-0000-4000-8000-000000000001';

insert into public.club_events (club_id, title, notes, happens_on, created_by)
select 'c0000000-0000-4000-8000-000000000001', 'conversa do clube', 'a irla traz o bolo ✦', current_date + 12, id
from public.profiles where name = 'Irla';

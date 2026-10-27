import type { MagazineSource } from './buildMagazineData'

/**
 * Dados de exemplo da especificação (espelham supabase/seed.sql): clube "Dois Amores",
 * Leyna, Irla, Wanessa e Thaís, edições de maio a outubro de 2026.
 * Citações ficam vazias (não inventamos trechos de livros reais).
 */
const book = (n: number, title: string, author: string, pages: number | null) => ({
  id: `b${n}`,
  title,
  author,
  pages,
  cover_url: null,
})

export const SAMPLE_BOOKS = {
  tudo: book(1, 'Tudo é rio', 'Carla Madeira', 213),
  cabeca: book(2, 'A cabeça do santo', 'Socorro Acioli', 192),
  homens: book(3, 'Eu que nunca conheci os homens', 'Jacqueline Harpman', 208),
  hope: book(4, 'O massacre da família Hope', 'Riley Sager', 383),
  tres: book(5, 'Três', 'Valérie Perrin', 672),
  amanhecer: book(6, 'Amanhecer na colheita', 'Suzanne Collins', 400),
  torto: book(7, 'Torto arado', 'Itamar Vieira Junior', 280),
  hora: book(8, 'A hora da estrela', 'Clarice Lispector', 96),
  biblioteca: book(9, 'A biblioteca da meia-noite', 'Matt Haig', 304),
  verity: book(10, 'Verity', 'Colleen Hoover', 340),
  avesso: book(11, 'O avesso da pele', 'Jeferson Tenório', null),
  asa: book(12, 'Quarta asa', 'Rebecca Yarros', 518),
  aia: book(13, 'O conto da aia', 'Margaret Atwood', 352),
  agua: book(14, 'Água fresca para as flores', 'Valérie Perrin', 555),
}

const B = SAMPLE_BOOKS
const members = [
  { user_id: 'leyna', joined_at: '2026-04-20T13:00:00Z', profile: { name: 'Leyna', avatar_url: null } },
  { user_id: 'irla', joined_at: '2026-04-20T21:30:00Z', profile: { name: 'Irla', avatar_url: null } },
  { user_id: 'wanessa', joined_at: '2026-04-21T12:15:00Z', profile: { name: 'Wanessa', avatar_url: null } },
  { user_id: 'thais', joined_at: '2026-04-22T00:40:00Z', profile: { name: 'Thaís', avatar_url: null } },
]

const edition = (n: number, b: typeof B.tudo, started: string, finished: string) => ({
  status: 'finished',
  started_on: started,
  finished_on: finished,
  edition_number: n,
  book: b,
})

const LONG_COMMENT =
  'Gostei muito dos plots e de como a história vai juntando as peças. No começo achei que seria um livro ' +
  'sobre amizade e só, mas cada capítulo muda o que a gente pensava do anterior. Os personagens me irritaram ' +
  'em vários momentos, o que acho que era a intenção, e mesmo assim fiquei torcendo por eles até o fim. ' +
  'Algumas partes do meio são lentas e eu teria cortado umas cem páginas, mas o final compensa tudo, ' +
  'principalmente pela forma como a autora amarra as pontas sem entregar tudo de bandeja. Fiquei pensando ' +
  'nele por dias e já quero reler sabendo o que sei agora. Recomendo para quem gosta de histórias longas, ' +
  'com muitos personagens e uma narrativa que vai e volta no tempo sem perder o fio.'

type R = [string, typeof B.tudo, string, string | null, number | null, number | null, number | null, number | null, string | null, string | null]
const r = ([user, b, started, finished, c, p, w, e, fav, comment]: R) => ({
  user_id: user,
  book_id: b.id,
  started_on: started,
  finished_on: finished,
  rank_characters: c,
  rank_plot: p,
  rank_writing: w,
  rank_ending: e,
  favorite_character: fav,
  favorite_quote: null,
  comment,
  book: b,
})

export const sampleSource: MagazineSource = {
  club: { name: 'Dois Amores', cover_url: null },
  members,
  clubBooks: [
    edition(1, B.tudo, '2026-05-01', '2026-05-28'),
    edition(2, B.cabeca, '2026-06-01', '2026-06-27'),
    edition(3, B.homens, '2026-07-01', '2026-07-25'),
    edition(4, B.hope, '2026-08-01', '2026-08-30'),
    edition(5, B.tres, '2026-09-01', '2026-09-29'),
    edition(6, B.amanhecer, '2026-10-01', '2026-10-18'),
    { status: 'pending', started_on: null, finished_on: null, edition_number: null, book: B.torto },
  ],
  readings: (
    [
      ['leyna', B.tudo, '2026-05-01', '2026-05-20', 5, 5, 5, 4, 'Dalva', 'Um soco no estômago escrito com delicadeza.'],
      ['irla', B.tudo, '2026-05-02', '2026-05-26', 4, 4, 5, 4, 'Lucy', 'Sublinhei metade do livro.'],
      ['wanessa', B.tudo, '2026-05-03', '2026-05-28', 4, 3, 4, 3, 'Venâncio', 'Pesado, mas impossível de largar.'],
      ['thais', B.tudo, '2026-05-01', '2026-05-18', 5, 4, 5, 5, 'Dalva', null],
      ['leyna', B.cabeca, '2026-06-01', '2026-06-21', 4, 4, 4, 4, 'Samuel', 'Leve, engraçado e cheio de fé.'],
      ['irla', B.cabeca, '2026-06-02', '2026-06-25', 4, 3, 4, 3, null, 'Gostei do clima de cidade pequena.'],
      ['wanessa', B.cabeca, '2026-06-01', '2026-06-27', 3, 3, 4, 2, 'Samuel', 'Bonita, mas demorei para entrar.'],
      ['thais', B.cabeca, '2026-06-05', '2026-06-26', 5, 4, 5, 4, 'Samuel', 'Me fez querer conhecer o Ceará.'],
      ['leyna', B.homens, '2026-07-01', '2026-07-14', 5, 4, 5, 5, 'A narradora', 'Fiquei dias pensando nesse final.'],
      ['irla', B.homens, '2026-07-01', '2026-07-22', 5, 5, 4, 5, 'A narradora', 'Uma leitura que pede pausa.'],
      ['wanessa', B.homens, '2026-07-03', '2026-07-25', 4, 4, 4, 3, null, null],
      ['thais', B.homens, '2026-07-02', null, null, null, null, null, null, null],
      ['leyna', B.hope, '2026-08-01', '2026-08-19', 4, 5, 3, 4, 'Kit McDeere', 'Virei a noite para terminar.'],
      ['irla', B.hope, '2026-08-04', '2026-08-30', 3, 4, 3, 3, 'Lenora Hope', null],
      ['wanessa', B.hope, '2026-08-01', '2026-08-12', 5, 5, 4, 5, 'Lenora Hope', 'O meu tipo favorito de suspense.'],
      ['thais', B.hope, '2026-08-02', '2026-08-28', 3, 3, 3, 2, 'Kit McDeere', 'Adivinhei o final cedo demais.'],
      ['leyna', B.tres, '2026-09-01', '2026-09-27', 5, 4, 5, 4, 'Nina', 'Me acompanhou por dias, e o final ficou comigo.'],
      ['irla', B.tres, '2026-09-01', '2026-09-29', 5, 5, 5, 4, 'Étienne', LONG_COMMENT],
      ['wanessa', B.tres, '2026-09-02', '2026-09-28', 4, 4, 4, 3, 'Adrien', 'Os três amigos parecem gente de verdade.'],
      ['thais', B.tres, '2026-09-03', '2026-09-29', 5, 5, 4, 5, 'Virginie', 'Chorei no capítulo final.'],
      ['leyna', B.amanhecer, '2026-10-01', '2026-10-12', 4, 5, 4, 5, 'Haymitch Abernathy', 'Doeu do jeito certo.'],
      ['irla', B.amanhecer, '2026-10-01', '2026-10-17', 4, 4, 4, 4, 'Maysilee Donner', null],
      ['wanessa', B.amanhecer, '2026-10-02', '2026-10-09', 5, 5, 4, 5, 'Haymitch Abernathy', 'Melhor livro da série depois do primeiro.'],
      ['thais', B.amanhecer, '2026-10-01', '2026-10-18', 4, 4, 3, 4, 'Lenore Dove', 'Gostei, mas esperava mais do meio.'],
      ['leyna', B.biblioteca, '2026-06-03', '2026-06-15', 4, 4, 4, 5, null, 'Perfeito para uma semana difícil.'],
      ['leyna', B.agua, '2026-08-05', '2026-08-29', 5, 4, 5, 5, 'Violette', 'Agora entendi por que todo mundo ama.'],
      ['leyna', B.hora, '2026-10-10', null, null, null, null, null, null, null],
      ['irla', B.avesso, '2026-05-05', '2026-05-19', 5, 4, 5, 4, null, 'Necessário.'],
      ['irla', B.aia, '2026-07-10', '2026-07-31', 5, 5, 5, 4, 'June', null],
      ['irla', B.asa, '2026-09-05', '2026-09-24', 3, 4, 3, 4, null, 'Divertido, mas não é para mim.'],
      ['wanessa', B.verity, '2026-06-10', '2026-06-14', 3, 5, 3, 5, null, 'Que final!'],
      ['wanessa', B.asa, '2026-08-13', '2026-08-26', 5, 5, 4, 4, 'Xaden', 'Já quero o próximo.'],
      ['wanessa', B.biblioteca, '2026-10-11', null, null, null, null, null, null, null],
      ['thais', B.hora, '2026-05-20', '2026-05-24', 5, 3, 5, 4, 'Macabéa', 'Curto e enorme ao mesmo tempo.'],
      ['thais', B.aia, '2026-09-01', '2026-09-20', 4, 5, 4, 3, null, null],
      ['thais', B.agua, '2026-10-12', null, null, null, null, null, null, null],
    ] as R[]
  ).map(r),
}

# Dois Amores · clube do livro

PWA para registrar leituras pessoais e de clubes de leitura, com feed, prateleiras,
sugestões por IA e exportação de uma revista em PDF.

> Documentação completa (Supabase, Google, Vercel, novos templates) é concluída na última fase.

## Stack

Vite + React + TypeScript + Tailwind CSS · vite-plugin-pwa · Supabase (Postgres, Auth,
Storage, Edge Functions) · Vercel · @react-pdf/renderer · Open Library · Google Gemini.

## Rodando localmente

Pré-requisitos: Node 22+, Docker Desktop aberto.

```bash
npm install
cp .env.example .env.local      # preencha com os dados do Supabase local ou remoto
npm run db:start                # sobe o Supabase local (Docker) e aplica migrações + seed
npm run dev                     # http://localhost:5173
```

## Scripts

| Script | O que faz |
|---|---|
| `npm run dev` | servidor de desenvolvimento |
| `npm run build` | checagem de tipos + build de produção (gera o service worker) |
| `npm test` | testes unitários (Vitest) |
| `npm run test:db` | testes do banco e das regras RLS (pgTAP, precisa do Supabase local) |
| `npm run lint` | ESLint |
| `npm run icons` | regenera os ícones do PWA a partir de `public/logo.svg` |
| `npm run db:reset` | recria o banco local com migrações e seed |
| `npm run db:types` | gera `src/types/database.ts` a partir do banco local |

## Banco de dados

Migrações versionadas em [supabase/migrations](supabase/migrations), com RLS em todas as tabelas.

| Tabela | Conteúdo | Quem lê | Quem escreve |
|---|---|---|---|
| `profiles` | nome, avatar, bio (criado no cadastro) | autenticados | o próprio usuário |
| `books` | catálogo da Open Library | autenticados | RPC `upsert_book` |
| `user_books` | leitura: datas, 4 notas (1–5), favorito, citação, comentário | autenticados | o próprio usuário |
| `posts` | feed (criado/removido por trigger ao preencher/apagar o fim) | autenticados | trigger |
| `reading_list` | "Quero ler" | o próprio usuário | o próprio usuário |
| `clubs` | nome, capa, código de convite | membros | dona (nome/capa); RPCs |
| `club_members` | membros e papel (`owner`/`member`) | membros | RPCs; sair; dona remove |
| `club_books` | `pending → reading → finished` ou `rejected`, nº da edição | membros | RPCs |
| `club_book_votes` | votos de aprovação | membros | o próprio membro, enquanto pendente |

RPCs: `upsert_book`, `create_club`, `join_club`, `regenerate_invite_code`,
`propose_club_book`, `finish_club_book`.

**Aprovação de livros do clube:** votam os membros que já estavam no clube quando o livro
foi proposto; quem propõe já aprova; uma reprovação rejeita; quando todos aprovam o livro
entra em leitura. A mesma regra existe em SQL (`evaluate_club_book`) e em TypeScript
([src/lib/domain/clubApproval.ts](src/lib/domain/clubApproval.ts)).

**Storage:** `avatars/<user_id>/…` (cada um na própria pasta) e `club-covers/<club_id>/…`
(só a dona do clube), ambos públicos para leitura, até 2 MB e 5 MB.

**Dados de exemplo** ([supabase/seed.sql](supabase/seed.sql), só local): clube "Dois Amores",
Leyna, Irla, Wanessa e Thaís (`<nome>@example.com`, senha `dois-amores`), edições de maio a
outubro de 2026 e uma proposta pendente.

Aplicar as migrações no projeto remoto:

```bash
npx supabase link --project-ref <project-ref>
npx supabase db push
```

## Dados dos livros

- **Open Library** é a identidade do livro: a busca e a chave `openlibrary_work_key` agrupam
  todas as edições de uma obra, o que mantém as notas do clube juntas. A busca pede edições em
  português (`lang=pt`) e usa o título e a capa delas quando existem.
- **Google Books** completa o livro ao salvar (Edge Function [books](supabase/functions/books/index.ts),
  chave `GOOGLE_BOOKS_API_KEY` só no servidor): procura a edição em português com o mesmo título e
  autor, prefere ISBN brasileiro (978-65/978-85), ignora adaptações (quadrinhos, box) e usa a
  **sinopse da editora**, a **capa** e o número de páginas. Se a Google só tiver a edição de Portugal,
  a capa da Open Library tem preferência.
- Toda capa é copiada para o bucket público `covers` (servido pelo Supabase, com CORS para o PDF).
- Sem sinopse em português na Google, a IA traduz o resumo da Open Library (abaixo).
- A Google Books costuma responder 503 de forma intermitente: a função tenta de novo e, se não
  conseguir, salva o livro assim mesmo e completa na próxima visita.

## Inteligência artificial

Toda chamada de IA passa pela Edge Function [supabase/functions/ai](supabase/functions/ai/index.ts);
a chave nunca vai para o navegador. O provedor fica atrás da interface `AiProvider`
([supabase/functions/_shared/ai](supabase/functions/_shared/ai)); para trocar, crie outro
adaptador e registre em `createAiProvider`.

- Modelo padrão: `gemini-3.5-flash-lite`, com `gemini-3.1-flash-lite` de reserva (troque com
  `GEMINI_MODEL` / `GEMINI_FALLBACK_MODELS`). O `gemini-2.5-flash` da especificação não está mais
  disponível para contas novas, e o `gemini-3.8-flash` levou 70–90 s por resposta nos testes.
- Cada tentativa tem limite de 25 s; com erro 429/5xx ou demora, tenta de novo e passa para o reserva.
- Limite de 20 chamadas por pessoa por dia (`AI_DAILY_LIMIT`); falhas do provedor devolvem a cota.

Ações disponíveis: `translate-summary` (traduz o resumo da Open Library para o português uma vez
por livro e guarda o original em `books.summary_original`).

```bash
# local (todas as funções)
npx supabase functions serve --env-file supabase/functions/.env
# produção
npx supabase secrets set --env-file supabase/functions/.env
npx supabase functions deploy ai books
```

## Identidade visual

Toda cor, fonte, tamanho, espaçamento, raio e sombra vem de [src/theme/tokens.ts](src/theme/tokens.ts).
Os tokens viram variáveis CSS (`--da-*`) e são a única fonte do tema do Tailwind — o tema
padrão do Tailwind não é carregado. O teste `noHardcodedStyles.test.ts` falha se algum
componente usar cor, fonte ou tamanho literal.

Para trocar a identidade visual: edite `tokens.ts`, substitua `public/logo.svg` e as fontes
em `public/fonts/`, e rode `npm run icons`.

## Estrutura

```
public/            fontes TTF (UI + PDF), logo e ícones do PWA
assets/decor/      adesivos e fitas decorativas (opcionais)
templates/revista/ templates da revista em PDF, um por pasta
src/theme/         design tokens
src/app/           rotas e layout (barra inferior no mobile, lateral no desktop)
src/components/ui/ componentes de interface
src/features/      telas por funcionalidade
src/lib/           Supabase, Open Library, IA e regras de domínio
supabase/          migrações, testes pgTAP, seed e Edge Functions
```

# Dois Amores · clube do livro

PWA para registrar leituras pessoais e de clubes do livro: feed, prateleiras, sugestões
com IA e exportação de uma revista em PDF do clube. Funciona no celular (instalável no
iPhone pelo Safari) e no computador.

**Funcionalidades**

- **Conta:** e-mail e senha (com confirmação e recuperação), login com Google, foto de
  perfil (do Google ou enviada, redimensionada para 512×512 e sem metadados EXIF), exclusão
  de conta.
- **Início:** livros lidos, páginas lidas, clubes e leituras recentes.
- **Feed:** quem terminou qual livro, com capa, nota média, data e comentário.
- **Publicar leitura:** busca com autocomplete (Open Library, 5 sugestões, teclado), datas,
  4 notas em estrelas, personagem favorito, citação (com "Sugerir com IA") e comentário.
- **Meus livros:** prateleiras Lidos, Em andamento e Quero ler; página do livro com sinopse em
  português; "Sugestão de próxima leitura" com IA (livros confirmados na Open Library).
- **Clubes:** criar (com capa), entrar por código, membros e seus dados literários, propor
  livros com aprovação unânime, prateleiras do clube, sugestão do clube com IA e
  **exportação da revista em PDF**.

## Sumário

1. [Stack e arquitetura](#stack-e-arquitetura)
2. [Contas necessárias (tudo gratuito)](#contas-necessárias-tudo-gratuito)
3. [Rodando localmente](#rodando-localmente)
4. [Configurando o Supabase](#configurando-o-supabase)
5. [Login com Google](#login-com-google)
6. [E-mails de confirmação (Gmail)](#e-mails-de-confirmação-gmail)
7. [Chaves de IA e de livros](#chaves-de-ia-e-de-livros)
8. [Deploy na Vercel](#deploy-na-vercel)
9. [Instalar no iPhone](#instalar-no-iphone)
10. [Testes](#testes)
11. [Banco de dados](#banco-de-dados)
12. [Dados dos livros](#dados-dos-livros)
13. [Inteligência artificial](#inteligência-artificial)
14. [Revista em PDF e novos templates](#revista-em-pdf-e-novos-templates)
15. [Identidade visual](#identidade-visual)
16. [Estrutura de pastas](#estrutura-de-pastas)
17. [Limites do plano gratuito](#limites-do-plano-gratuito)
18. [Decisões que diferem da especificação](#decisões-que-diferem-da-especificação)
19. [Solução de problemas](#solução-de-problemas)

## Stack e arquitetura

Vite + React 19 + TypeScript + Tailwind CSS 4 · vite-plugin-pwa · Supabase (Postgres, Auth,
Storage, Edge Functions) · Vercel · @react-pdf/renderer · Open Library · Google Books · Google Gemini.

Não há servidor próprio: o **Supabase é o backend**.

- **Autorização no banco:** Row Level Security em todas as tabelas. Cada pessoa só altera os
  próprios dados; clubes e votos só são visíveis para membros. Regras de negócio (criar e
  entrar em clube, aprovação unânime, numeração das edições, post no feed) são funções e
  triggers SQL, cobertas por testes pgTAP.
- **Segredos só no servidor:** as chaves do Gemini e da Google Books ficam nos segredos do
  Supabase e são usadas apenas pelas Edge Functions `ai` e `books`.
- **PDF no navegador:** a revista é gerada no aparelho com @react-pdf (sem Chromium), carregado
  só quando alguém exporta.

## Contas necessárias (tudo gratuito)

| Conta | Para quê | Link |
|---|---|---|
| GitHub | código e deploy automático | https://github.com |
| Supabase | banco, login, arquivos, funções | https://supabase.com/dashboard |
| Vercel | hospedagem (`*.vercel.app`) | https://vercel.com |
| Google Cloud | login com Google e chave da Google Books | https://console.cloud.google.com |
| Google AI Studio | chave do Gemini | https://aistudio.google.com/apikey |
| Gmail dedicado | enviar e-mails de confirmação e recuperação | https://accounts.google.com/signup |
| Docker Desktop | Supabase local (desenvolvimento) | https://www.docker.com/products/docker-desktop |

A Open Library não precisa de conta.

## Rodando localmente

Pré-requisitos: **Node 22+** e **Docker Desktop aberto**.

```bash
npm install
npm run db:start                       # sobe o Supabase local e aplica migrações + seed
npx supabase status -o env             # mostra API_URL e ANON_KEY do ambiente local
cp .env.example .env.local             # cole API_URL em VITE_SUPABASE_URL e ANON_KEY em VITE_SUPABASE_ANON_KEY
cp supabase/.env.example supabase/.env # preencha as chaves (veja as seções abaixo)
npm run dev                            # http://localhost:5173
```

Para as funções de IA e de livros, crie `supabase/functions/.env` só com
`GEMINI_API_KEY=` e `GOOGLE_BOOKS_API_KEY=` (copiados de `supabase/.env`) e rode em outro terminal:

```bash
npx supabase functions serve --env-file supabase/functions/.env
```

**Contas de exemplo** (seed local): `leyna@example.com`, `irla@example.com`,
`wanessa@example.com` e `thais@example.com`, todas com a senha `dois-amores`.
E-mails enviados localmente aparecem no Mailpit: http://127.0.0.1:54324.

| Script | O que faz |
|---|---|
| `npm run dev` | servidor de desenvolvimento |
| `npm run build` | checagem de tipos + build de produção (gera o service worker) |
| `npm test` | testes unitários, de telas, do PDF e de acessibilidade (Vitest) |
| `npm run test:db` | testes do banco e das regras RLS (pgTAP; precisa do Supabase local) |
| `npm run lint` | ESLint |
| `npm run icons` | regenera os ícones do PWA a partir de `public/logo.svg` |
| `npm run db:reset` | recria o banco local com migrações e seed (**apaga as contas locais**) |
| `npm run db:types` | gera `src/types/database.ts` a partir do banco local |

## Configurando o Supabase

1. Crie um projeto em https://supabase.com/dashboard e guarde a senha do banco.
2. Faça login no CLI e vincule o projeto:
   ```bash
   npx supabase login
   npx supabase link --project-ref <project-ref>
   ```
3. Aplique as migrações (tabelas, RLS, funções, buckets do Storage):
   ```bash
   npx supabase db push
   ```
4. Ajuste em [supabase/config.toml](supabase/config.toml) o bloco `[remotes.production]`
   (`project_id`, `site_url` e `additional_redirect_urls` com o seu domínio da Vercel) e envie
   a configuração de login (Google, SMTP, e-mails em português, URLs):
   ```bash
   npx supabase config diff     # confira antes
   npx supabase config push
   ```
   Os valores secretos (`env(...)`) vêm de `supabase/.env`, que fica fora do git.
5. Envie os segredos das funções e publique-as:
   ```bash
   npx supabase secrets set --env-file supabase/functions/.env
   npx supabase functions deploy ai books
   ```
6. Em **Project Settings → API Keys**, copie a URL e a chave **publishable/anon** para a Vercel
   (nunca use a `service_role` no front-end).

## Login com Google

1. Em https://console.cloud.google.com crie um projeto.
2. **Google Auth Platform → Branding:** nome do app, e-mail de suporte, página inicial
   (`https://<seu-app>.vercel.app`), política de privacidade (`https://<seu-app>.vercel.app/privacidade`)
   e domínio autorizado (`<seu-app>.vercel.app`).
3. **Clients → Criar cliente → Aplicativo da Web:**
   - Origens JavaScript: `http://localhost:5173` e `https://<seu-app>.vercel.app`
   - URIs de redirecionamento: `https://<project-ref>.supabase.co/auth/v1/callback` e
     `http://127.0.0.1:54321/auth/v1/callback` (local)
4. Copie o ID e a chave secreta do cliente para `supabase/.env`
   (`SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` e `SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET`) e rode
   `npx supabase config push`.
5. **Público → Publicar app** (sem isso, só usuários de teste entram com Google).

## E-mails de confirmação (Gmail)

O envio padrão do Supabase só entrega para membros da equipe do projeto. Para usuários reais,
use um Gmail dedicado:

1. Crie a conta, ative a **verificação em duas etapas** e gere uma **senha de app** em
   https://myaccount.google.com/apppasswords.
2. Em `supabase/.env`: `SMTP_USER=<o gmail>` e `SMTP_PASS=<senha de app, sem espaços>`.
3. `npx supabase config push` (o SMTP já está declarado em `[remotes.production.auth.email.smtp]`).

Limite: cerca de 500 e-mails por dia.

## Chaves de IA e de livros

- **Gemini:** https://aistudio.google.com/apikey → `GEMINI_API_KEY`.
- **Google Books:** no Google Cloud, ative a **Books API** e crie uma **chave de API restrita à
  Books API** → `GOOGLE_BOOKS_API_KEY`. Sem chave, a API usa uma cota anônima compartilhada que
  costuma estar esgotada.

As duas vão em `supabase/.env` e em `supabase/functions/.env` (este último é enviado com
`npx supabase secrets set --env-file supabase/functions/.env`).

## Deploy na Vercel

1. Em https://vercel.com/new importe o repositório.
2. **Environment Variables:** `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (publishable).
3. **Deploy.** A cada push na branch principal a Vercel publica de novo.
4. Use a URL final em: `site_url` e `additional_redirect_urls` do `config.toml`
   (`[remotes.production]`) + `npx supabase config push`, e nas origens/branding do Google Cloud.

O [vercel.json](vercel.json) redireciona todas as rotas para o `index.html` (SPA) e evita cache
do service worker.

## Instalar no iPhone

1. Abra o site no **Safari**.
2. Toque em **Compartilhar** (quadrado com seta) → **Adicionar à Tela de Início**.
3. O app abre em tela cheia, com ícone próprio. Telas já visitadas e capas funcionam offline.

No Android/Chrome aparece a opção **Instalar app** no menu.

## Testes

| Comando | O que cobre |
|---|---|
| `npm test` | regras (estatísticas, média das notas = média das médias, aprovação no clube, votos, código de convite), telas (login, formulário com autocomplete e teclado, feed, prateleiras, clubes, revista), **geração do PDF** com os dados de exemplo, Edge Functions (prompts, provedor de IA com reserva, Google Books), acessibilidade (axe-core) e contraste das cores (WCAG) |
| `npm run test:db` | RLS e funções do banco: quem lê e altera o quê, post automático, aprovação unânime, entrada tardia no clube, exclusão de conta, cotas de IA, Storage |

O teste [noHardcodedStyles](src/theme/noHardcodedStyles.test.ts) falha se algum componente usar
cor, fonte ou tamanho fora dos tokens.

## Banco de dados

Migrações versionadas em [supabase/migrations](supabase/migrations), com RLS em todas as tabelas.

| Tabela | Conteúdo | Quem lê | Quem escreve |
|---|---|---|---|
| `profiles` | nome, avatar, bio (criado no cadastro) | autenticados | o próprio usuário |
| `books` | catálogo (Open Library + Google Books) | autenticados | RPC `upsert_book`; Edge Function `books` |
| `user_books` | leitura: datas, 4 notas (1–5), favorito, citação, comentário | autenticados | o próprio usuário |
| `posts` | feed (criado/removido por trigger ao preencher/apagar a data de fim) | autenticados | trigger |
| `reading_list` | "Quero ler" | o próprio usuário | o próprio usuário |
| `clubs` | nome, capa, código de convite | membros | dona (nome/capa); RPCs |
| `club_members` | membros e papel (`owner`/`member`) | membros | RPCs; sair; dona remove |
| `club_books` | `pending → reading → finished` ou `rejected`, nº da edição | membros | RPCs |
| `club_book_votes` | votos de aprovação | membros | o próprio membro, enquanto pendente |
| `ai_usage` | chamadas de IA por pessoa e dia | o próprio usuário | Edge Function `ai` |

**Aprovação de livros do clube:** votam os membros que já estavam no clube quando o livro foi
proposto; quem propõe já aprova; uma reprovação rejeita; quando todos aprovam, o livro entra em
leitura. A regra existe em SQL (`evaluate_club_book`) e em TypeScript
([src/lib/domain/clubApproval.ts](src/lib/domain/clubApproval.ts)).

**Storage:** `avatars/<user_id>/…` (cada um na própria pasta), `club-covers/<club_id>/…` (só a
dona do clube) e `covers/<book_id>.jpg` (só as Edge Functions). Todos públicos para leitura.

**Dados de exemplo** ([supabase/seed.sql](supabase/seed.sql), só local): clube "Dois Amores",
Leyna, Irla, Wanessa e Thaís, edições de maio a outubro de 2026 e uma proposta pendente.

## Dados dos livros

- **Open Library** é a identidade do livro: a busca e a chave `openlibrary_work_key` agrupam
  todas as edições de uma obra, o que mantém as notas do clube juntas. A busca pede edições em
  português (`lang=pt`) e usa o título e a capa delas quando existem.
- **Google Books** completa o livro (Edge Function [books](supabase/functions/books/index.ts)):
  procura a edição em português com o mesmo título e autor (busca livre e, se não achar, com
  filtros), prefere ISBN brasileiro (978-65/978-85), ignora adaptações (quadrinhos, box) e usa a
  **sinopse da editora**, a **capa** e o número de páginas. Se só houver a edição de Portugal, a
  capa da Open Library tem preferência.
- Toda capa é copiada para o bucket `covers` (rápida, sem depender de terceiros e com CORS para
  o PDF). Livros antigos são completados em segundo plano quando aparecem na tela.
- Sem sinopse em português na Google, a IA traduz o resumo da Open Library.

## Inteligência artificial

Toda chamada de IA passa pela Edge Function [ai](supabase/functions/ai/index.ts). O provedor fica
atrás da interface `AiProvider` ([supabase/functions/_shared/ai](supabase/functions/_shared/ai));
para trocar, crie outro adaptador e registre em `createAiProvider` (`AI_PROVIDER`).

- Modelo padrão: `gemini-3.5-flash-lite`, com `gemini-3.1-flash-lite` de reserva (`GEMINI_MODEL`,
  `GEMINI_FALLBACK_MODELS`).
- Cada tentativa tem limite de 25 s; com erro 429/5xx ou demora, tenta de novo e passa para o reserva.
- Limite de 20 chamadas por pessoa por dia (`AI_DAILY_LIMIT`); falhas do provedor devolvem a cota.
- Para a IA vão só títulos, autores, sinopses e notas. Na sugestão do clube, os membros vão
  como "Membro 1, 2…", sem nomes.

| Ação | O que faz |
|---|---|
| `translate-summary` | traduz o resumo da Open Library para o português, uma vez por livro (o original fica em `books.summary_original`) |
| `suggest-quotes` | até 3 citações; o app mostra "sugerido por IA, confira se é literal" e só preenche o campo se a pessoa escolher |
| `suggest-next-reads` | 3 próximas leituras a partir dos títulos, autores e notas; cada sugestão é confirmada na Open Library e o que a pessoa já leu ou tem na lista fica de fora |
| `suggest-club-reads` | 3 sugestões para o clube a partir dos livros do clube e da média das 4 notas de cada membro em cada livro; confirmadas na Open Library |

## Revista em PDF e novos templates

Em **Clubes → (clube) → Exportar revista**: escolha o template e o período e toque em
**Gerar PDF**. O template "dois-amores" (16:9) tem capa, Book Track (10 × 3 por página), um
Book Review por livro (uma coluna por membro, até 4 por página) e "Enquanto isso, fora do
clube…". Textos longos diminuem até 8 pt e continuam numa página extra; campos vazios mostram
estados vazios elegantes; capas faltantes viram placeholder na cor papel.

**Como adicionar um template:** veja [templates/revista/README.md](templates/revista/README.md).
Em resumo, crie `templates/revista/<id>/` com `tokens.json` e `template.tsx`; o app descobre a
pasta sozinho.

## Identidade visual

Toda cor, fonte, tamanho, espaçamento, raio e sombra da interface vem de
[src/theme/tokens.ts](src/theme/tokens.ts). Os tokens viram variáveis CSS (`--da-*`) e são a única
fonte do tema do Tailwind (o tema padrão do Tailwind não é carregado). A revista tem os próprios
valores em `templates/revista/<id>/tokens.json`.

Para trocar a identidade visual: edite `tokens.ts`, substitua `public/logo.svg` e as fontes em
`public/fonts/` (TTF, usadas pela interface e pelo PDF) e rode `npm run icons`.

## Estrutura de pastas

```
public/              fontes TTF (interface + PDF), logo e ícones do PWA
assets/decor/        adesivos e fitas decorativas (opcionais)
templates/revista/   templates da revista em PDF, um por pasta (+ _shared com o contrato)
src/theme/           design tokens e testes de contraste e de estilos fixos
src/app/             rotas e layout (barra inferior no celular, lateral no desktop)
src/components/      componentes de interface (botões, campos, estrelas, capas, busca)
src/features/        telas: auth, home, feed, readings, shelf, clubs, magazine, profile, legal
src/lib/             Supabase, Open Library, IA, livros e regras de domínio
supabase/migrations/ esquema, RLS, funções e Storage (SQL versionado)
supabase/functions/  Edge Functions "ai" e "books" (+ _shared)
supabase/tests/      testes pgTAP
supabase/templates/  e-mails de autenticação em português
```

## Limites do plano gratuito

| Serviço | Limite |
|---|---|
| Supabase | 500 MB de banco, 1 GB de arquivos. **O projeto pausa após 7 dias sem uso**: reative com um clique no painel. |
| Vercel Hobby | uso não comercial |
| Gemini | cota diária do plano gratuito (o app limita a 20 chamadas por pessoa/dia); no plano gratuito o Google pode usar os prompts para melhorar os modelos |
| Google Books | 1.000 buscas por dia (uma por livro novo) |
| Gmail (SMTP) | ~500 e-mails por dia |

## Decisões que diferem da especificação

| Especificação | Como ficou | Por quê |
|---|---|---|
| Login com Apple | removido | a conta Apple Developer é paga |
| `gemini-2.5-flash` | `gemini-3.5-flash-lite` (+ reserva), configurável | o 2.5 Flash não está disponível para contas novas; o 3.8 Flash levou 70–90 s por resposta |
| Só Open Library | Open Library + **Google Books** | sinopses e capas das edições brasileiras (11 de 11 livros do clube, contra 2 de 11) |
| Resumo da Open Library | sinopse da editora (Google) ou tradução por IA | a Open Library quase sempre traz o resumo em inglês |
| 3 abas | 4 abas (Início, Feed, Meus livros, Clubes) | a tela inicial do Figma não tinha como ser acessada |
| — | lista "Quero ler" | o Figma tem "Adicionar à lista" nas sugestões |
| "Enquanto isso": uma página por membro | dois membros por página (configurável em `tokens.json`) | igual à revista de referência |
| Rosa `#F28CA5` nas abas inativas | rosa escurecido `#B03A5E` | contraste de 2:1 → 4,7:1 (WCAG AA); o rosa original segue no logotipo e nas estrelas |
| Domínio próprio | `*.vercel.app` | projeto 100% gratuito |

## Solução de problemas

- **"Cannot connect to the Docker daemon" / Supabase local não sobe:** abra o Docker Desktop e
  espere ficar pronto antes de `npm run db:start`.
- **Erro 409 / "Key is not present in table profiles" no ambiente local:** o banco local foi
  recriado (`db reset`) e a conta logada não existe mais. O app desloga sozinho ao abrir;
  entre de novo ou use uma conta do seed.
- **`functions serve` encerra logo após iniciar ("name resolution failed"):** o contêiner antigo
  das funções ainda estava parando. Espere alguns segundos e rode de novo.
- **Primeira chamada a uma função responde "invalid response from the upstream server":** a
  função ainda estava compilando; repita a chamada.
- **Capas ou sinopses em inglês:** a Google Books oscila (erros 503). O livro é completado na
  próxima vez que aparecer na tela.
- **Projeto do Supabase pausado:** reative no painel (plano gratuito pausa após 7 dias sem uso).

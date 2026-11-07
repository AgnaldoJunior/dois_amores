/**
 * "Qual é o seu lado leitora?" — 15 perguntas e 8 arquétipos.
 *
 * Cada resposta soma pontos para um ou mais arquétipos; o resultado é o arquétipo
 * com mais pontos, o segundo colocado e o "DNA" (quanto de cada um mora em você,
 * em relação ao principal).
 */

export type ArchetypeId =
  | 'coracao'
  | 'detetive'
  | 'viajante'
  | 'coruja'
  | 'exploradora'
  | 'sebo'
  | 'colecionadora'
  | 'contemplativa'

export type Archetype = {
  id: ArchetypeId
  name: string
  /** Subtítulo em inglês, como nas fichas do teste. */
  club: string
  description: string
  reveals: string
  explore: string
  books: { title: string; author: string; why: string }[]
  quote: { text: string; author: string; source: string }
}

export const ARCHETYPES: Record<ArchetypeId, Archetype> = {
  coracao: {
    id: 'coracao',
    name: 'a leitora de coração partido',
    club: 'feelings first club',
    description:
      'você lê com o coração aberto: se apega aos personagens como se fossem gente de verdade e guarda as histórias de amor por dias.',
    reveals: 'empatia, intensidade e uma memória afetiva enorme para personagens.',
    explore: 'romances históricos e histórias de amizade costumam render as suas cinco estrelas.',
    books: [
      { title: 'Três', author: 'Valérie Perrin', why: 'amizade que atravessa a vida inteira' },
      { title: 'Daisy Jones & The Six', author: 'Taylor Jenkins Reid', why: 'paixão, música e o que ficou sem dizer' },
      { title: 'Orgulho e preconceito', author: 'Jane Austen', why: 'o enemies to lovers original' },
    ],
    quote: { text: 'Você trespassou minha alma. Sou meio agonia, meio esperança.', author: 'Jane Austen', source: 'Persuasão' },
  },
  detetive: {
    id: 'detetive',
    name: 'a detetive dos plot twists',
    club: 'whodunit society',
    description: 'você desconfia de todo mundo, monta teorias antes do capítulo dez e vibra quando o final te pega de surpresa.',
    reveals: 'curiosidade, raciocínio rápido e gosto por quebra-cabeças.',
    explore: 'thrillers psicológicos e narradores não confiáveis são o seu habitat.',
    books: [
      { title: 'A paciente silenciosa', author: 'Alex Michaelides', why: 'uma virada que ninguém vê chegar' },
      { title: 'O massacre da família Hope', author: 'Riley Sager', why: 'mistério em camadas' },
      { title: 'Morte no Nilo', author: 'Agatha Christie', why: 'a rainha dos plot twists' },
    ],
    quote: { text: 'Quando você elimina o impossível, o que sobra, por mais improvável, deve ser a verdade.', author: 'Arthur Conan Doyle', source: 'O signo dos quatro' },
  },
  viajante: {
    id: 'viajante',
    name: 'a viajante de universos',
    club: 'map in the first page club',
    description: 'você lê para morar em outros mundos: mapas, magia e sistemas inteiros que parecem existir de verdade.',
    reveals: 'imaginação, fôlego para sagas e encanto pelos detalhes de um mundo.',
    explore: 'fantasias de série e ficção científica com construção de mundo caprichada.',
    books: [
      { title: 'A quinta estação', author: 'N. K. Jemisin', why: 'um mundo que respira' },
      { title: 'Jogos vorazes', author: 'Suzanne Collins', why: 'ritmo que não dá trégua' },
      { title: 'O hobbit', author: 'J. R. R. Tolkien', why: 'a viagem de onde tudo começou' },
    ],
    quote: { text: 'Nem todos os que vagueiam estão perdidos.', author: 'J. R. R. Tolkien', source: 'O senhor dos anéis' },
  },
  coruja: {
    id: 'coruja',
    name: 'a coruja da madrugada',
    club: 'one more chapter club',
    description:
      'você adora ficar completamente imersa em uma narrativa. se o capítulo termina com suspense, o sono que lute: mais cinco minutinhos facilmente viram duas horas.',
    reveals: 'imersão, entusiasmo e facilidade de se envolver com tramas envolventes.',
    explore: 'thrillers curtos e aventuras de ritmo acelerado são ótimos caminhos, mas vale testar histórias mais contemplativas.',
    books: [
      { title: 'Recursão', author: 'Blake Crouch', why: 'pra quem não consegue parar no capítulo' },
      { title: 'Jogos vorazes', author: 'Suzanne Collins', why: 'ritmo que não dá trégua' },
      { title: 'A empregada', author: 'Freida McFadden', why: 'uma virada atrás da outra' },
    ],
    quote: { text: 'Somos feitos da mesma matéria que os sonhos.', author: 'William Shakespeare', source: 'A tempestade' },
  },
  exploradora: {
    id: 'exploradora',
    name: 'a exploradora de gêneros',
    club: 'surprise me society',
    description: 'você lê conforme o humor e adora uma recomendação fora da curva: cada livro é uma porta para um lugar novo.',
    reveals: 'abertura, curiosidade e uma estante que não cabe em um gênero só.',
    explore: 'realismo mágico, contos e livros traduzidos de lugares que você ainda não leu.',
    books: [
      { title: 'Torto arado', author: 'Itamar Vieira Junior', why: 'um Brasil que você ainda não leu' },
      { title: '10 minutos e 38 segundos neste mundo estranho', author: 'Elif Shafak', why: 'Istambul em lembranças' },
      { title: 'Cem anos de solidão', author: 'Gabriel García Márquez', why: 'o realismo mágico em pessoa' },
    ],
    quote: { text: 'Ler é sonhar pela mão de outrem.', author: 'Fernando Pessoa', source: 'Livro do desassossego' },
  },
  sebo: {
    id: 'sebo',
    name: 'a alma de sebo',
    club: 'tea and blanket club',
    description: 'para você, ler é voltar para casa: manta, chá, poltrona e uma história que abraça.',
    reveals: 'afeto pelos detalhes, constância e gosto por histórias de conforto.',
    explore: 'cozy mysteries, romances de cidade pequena e releituras queridas.',
    books: [
      { title: 'A biblioteca da meia-noite', author: 'Matt Haig', why: 'uma segunda chance em cada livro' },
      { title: 'Água fresca para as flores', author: 'Valérie Perrin', why: 'delicadeza que abraça' },
      { title: 'O meu pé de laranja lima', author: 'José Mauro de Vasconcelos', why: 'para chorar quentinha' },
    ],
    quote: { text: 'Sempre imaginei que o paraíso fosse uma espécie de biblioteca.', author: 'Jorge Luis Borges', source: 'Poema dos dons' },
  },
  colecionadora: {
    id: 'colecionadora',
    name: 'a colecionadora de capas',
    club: 'special edition club',
    description: 'você julga um livro pela capa, sim, e não tem vergonha: edições especiais, pilhas e uma estante sempre lotada.',
    reveals: 'olho para o belo, amor pelo livro como objeto e uma fila de "quero ler" sem fim.',
    explore: 'clássicos em edição especial e graphic novels que pedem para ser folheadas.',
    books: [
      { title: 'O pequeno príncipe', author: 'Antoine de Saint-Exupéry', why: 'a edição que todo mundo quer' },
      { title: 'Circe', author: 'Madeline Miller', why: 'mito com capa de museu' },
      { title: 'A menina que roubava livros', author: 'Markus Zusak', why: 'um livro sobre amar livros' },
    ],
    quote: { text: 'Um quarto sem livros é como um corpo sem alma.', author: 'Cícero', source: 'atribuída' },
  },
  contemplativa: {
    id: 'contemplativa',
    name: 'a leitora contemplativa',
    club: 'slow reading society',
    description: 'você sublinha frases, para no meio da página para pensar e gosta de livros sobre gente comum e grandes silêncios.',
    reveals: 'sensibilidade, atenção às palavras e paciência para histórias que crescem devagar.',
    explore: 'clássicos brasileiros, contos intimistas e poesia de bolso.',
    books: [
      { title: 'A hora da estrela', author: 'Clarice Lispector', why: 'curto e enorme ao mesmo tempo' },
      { title: 'Vidas secas', author: 'Graciliano Ramos', why: 'cada palavra no lugar' },
      { title: 'Tudo é rio', author: 'Carla Madeira', why: 'para ler devagar e sublinhar' },
    ],
    quote: { text: 'Tudo no mundo começou com um sim.', author: 'Clarice Lispector', source: 'A hora da estrela' },
  },
}

export type Question = {
  kicker: string
  text: string
  options: { label: string; scores: Partial<Record<ArchetypeId, number>> }[]
}

export const QUESTIONS: Question[] = [
  {
    kicker: 'o primeiro instinto diz muito ♡',
    text: 'você entra numa livraria. qual é a primeira coisa que faz?',
    options: [
      { label: 'procuro uma história de amor inesquecível', scores: { coracao: 2 } },
      { label: 'vou direto aos mistérios', scores: { detetive: 2 } },
      { label: 'exploro universos fantásticos', scores: { viajante: 2 } },
      { label: 'olho todas as mesas de novidades', scores: { exploradora: 1, colecionadora: 1 } },
    ],
  },
  {
    kicker: 'confissões de leitora',
    text: 'qual dessas situações parece mais com você?',
    options: [
      { label: 'me apego aos personagens como se fossem reais', scores: { coracao: 2 } },
      { label: 'invento teorias antes do final', scores: { detetive: 2 } },
      { label: 'prometo dormir cedo e falho', scores: { coruja: 2 } },
      { label: 'leio dependendo do meu humor', scores: { exploradora: 2 } },
    ],
  },
  {
    kicker: 'seu cantinho de leitura',
    text: 'escolha o lugar perfeito para ler',
    options: [
      { label: 'um café antigo em Paris', scores: { coracao: 1, contemplativa: 1 } },
      { label: 'uma biblioteca cheia de passagens secretas', scores: { detetive: 1, viajante: 1 } },
      { label: 'meu quarto de madrugada, só com a luminária', scores: { coruja: 2 } },
      { label: 'um sebo com poltronas e pilhas de livros', scores: { sebo: 1, colecionadora: 1 } },
    ],
  },
  {
    kicker: 'a ressaca literária',
    text: 'um livro acabou. qual reação combina mais com você?',
    options: [
      { label: 'fico dias pensando no relacionamento dos protagonistas', scores: { coracao: 2 } },
      { label: 'preciso discutir todas as reviravoltas', scores: { detetive: 2 } },
      { label: 'tenho saudade do universo inteiro', scores: { viajante: 2 } },
      { label: 'já estou escolhendo cinco novas leituras', scores: { exploradora: 1, colecionadora: 1 } },
    ],
  },
  {
    kicker: 'cinco estrelas ★',
    text: 'o que mais te faz dar cinco estrelas?',
    options: [
      { label: 'química entre personagens e diálogos incríveis', scores: { coracao: 2 } },
      { label: 'um final que me deixa sem palavras', scores: { detetive: 1, coruja: 1 } },
      { label: 'um mundo que parece existir de verdade', scores: { viajante: 2 } },
      { label: 'uma história que me faz chorar de verdade', scores: { contemplativa: 1, sebo: 1 } },
    ],
  },
  {
    kicker: 'sem julgamentos, prometo',
    text: 'qual dessas é sua red flag literária?',
    options: [
      { label: 'amar personagens problemáticos', scores: { coracao: 1, coruja: 1 } },
      { label: 'desconfiar até do personagem principal', scores: { detetive: 2 } },
      { label: 'comprar livros mesmo com a estante lotada', scores: { colecionadora: 2 } },
      { label: 'abandonar um gênero por outro completamente diferente', scores: { exploradora: 2 } },
    ],
  },
  {
    kicker: 'protagonista da própria vida',
    text: 'se sua vida fosse um livro, qual seria o cenário?',
    options: [
      { label: 'uma pequena cidade cheia de amizades', scores: { sebo: 2 } },
      { label: 'uma academia antiga com sociedades secretas', scores: { detetive: 1, coruja: 1 } },
      { label: 'um reino distante com magia esquecida', scores: { viajante: 2 } },
      { label: 'uma viagem cheia de encontros inesperados', scores: { exploradora: 2 } },
    ],
  },
  {
    kicker: 'obsessão por tropes',
    text: 'escolha uma dessas tropes',
    options: [
      { label: 'enemies to lovers', scores: { coracao: 2 } },
      { label: 'narrador não confiável', scores: { detetive: 2 } },
      { label: 'found family', scores: { viajante: 1, sebo: 1 } },
      { label: 'segundas chances e reencontros', scores: { contemplativa: 1, coracao: 1 } },
    ],
  },
  {
    kicker: 'não julgue um livro… ou julgue',
    text: 'o que costuma te fazer começar um livro?',
    options: [
      { label: 'uma frase romântica que vi na internet', scores: { coracao: 2 } },
      { label: 'uma sinopse que não revela quase nada', scores: { detetive: 1, coruja: 1 } },
      { label: 'uma capa linda e uma edição especial', scores: { colecionadora: 2 } },
      { label: 'uma recomendação completamente fora do meu gosto habitual', scores: { exploradora: 2 } },
    ],
  },
  {
    kicker: 'o dilema da meia-noite',
    text: 'são 2h da manhã e faltam 100 páginas. você...',
    options: [
      { label: 'continuo se meu casal favorito estiver em perigo', scores: { coracao: 1, coruja: 1 } },
      { label: 'preciso descobrir quem é o culpado', scores: { detetive: 1, coruja: 1 } },
      { label: 'fico lendo até saber como termina a aventura', scores: { viajante: 1, coruja: 1 } },
      { label: 'marco onde parei e guardo para amanhã', scores: { contemplativa: 1, sebo: 1 } },
    ],
  },
  {
    kicker: 'crushes e amizades da ficção',
    text: 'que tipo de personagem conquista seu coração?',
    options: [
      { label: 'alguém sarcástico que esconde um coração enorme', scores: { coracao: 2 } },
      { label: 'alguém moralmente ambíguo e misterioso', scores: { detetive: 1, coruja: 1 } },
      { label: 'alguém que luta por sua família escolhida', scores: { viajante: 1, sebo: 1 } },
      { label: 'alguém sensível, imperfeito e muito humano', scores: { contemplativa: 2 } },
    ],
  },
  {
    kicker: 'lista de desejos',
    text: 'qual seria seu presente literário perfeito?',
    options: [
      { label: 'uma edição anotada do meu romance favorito', scores: { coracao: 1, colecionadora: 1 } },
      { label: 'um jogo investigativo inspirado em um thriller', scores: { detetive: 2 } },
      { label: 'um mapa ilustrado de um mundo fantástico', scores: { viajante: 1, colecionadora: 1 } },
      { label: 'um kit com chá, manta e livros-surpresa', scores: { sebo: 1, exploradora: 1 } },
    ],
  },
  {
    kicker: 'um capítulo novo',
    text: 'você quer experimentar um estilo novo. qual escolhe?',
    options: [
      { label: 'romance histórico cheio de tensão', scores: { coracao: 1, coruja: 1 } },
      { label: 'ficção científica com mistério', scores: { detetive: 1, viajante: 1 } },
      { label: 'realismo mágico', scores: { exploradora: 2 } },
      { label: 'contos intimistas sobre pessoas comuns', scores: { contemplativa: 2 } },
    ],
  },
  {
    kicker: 'um pouco pessoal demais',
    text: 'qual frase representa sua relação com os livros?',
    options: [
      { label: 'eu leio para sentir tudo', scores: { coracao: 1, contemplativa: 1 } },
      { label: 'eu leio para descobrir o inesperado', scores: { detetive: 1, exploradora: 1 } },
      { label: 'eu leio para viver outras vidas', scores: { viajante: 1, coruja: 1 } },
      { label: 'eu leio para me sentir em casa', scores: { sebo: 2 } },
    ],
  },
  {
    kicker: 'a página final ✦',
    text: 'última pergunta: que história você gostaria de encontrar amanhã?',
    options: [
      { label: 'uma paixão impossível que vale a pena', scores: { coracao: 2 } },
      { label: 'uma investigação que muda tudo', scores: { detetive: 2 } },
      { label: 'uma jornada fantástica cheia de descobertas', scores: { viajante: 2 } },
      { label: 'um livro-surpresa que eu nunca escolheria normalmente', scores: { exploradora: 2 } },
    ],
  },
]

export type QuizResult = {
  primary: Archetype
  secondary: Archetype
  /** Afinidade com os quatro arquétipos mais fortes, em % do principal. */
  dna: { archetype: Archetype; percent: number }[]
}

/** Pontua as respostas (índice da opção em cada pergunta). Empates: ordem de ARCHETYPES. */
export function scoreQuiz(answers: number[]): QuizResult {
  const order = Object.keys(ARCHETYPES) as ArchetypeId[]
  const totals = Object.fromEntries(order.map((id) => [id, 0])) as Record<ArchetypeId, number>
  answers.forEach((choice, i) => {
    const scores = QUESTIONS[i]?.options[choice]?.scores ?? {}
    for (const [id, pts] of Object.entries(scores)) totals[id as ArchetypeId] += pts
  })
  const ranked = [...order].sort((a, b) => totals[b] - totals[a] || order.indexOf(a) - order.indexOf(b))
  const top = Math.max(1, totals[ranked[0]!])
  return {
    primary: ARCHETYPES[ranked[0]!],
    secondary: ARCHETYPES[ranked[1]!],
    dna: ranked.slice(0, 4).map((id) => ({ archetype: ARCHETYPES[id], percent: Math.round((totals[id] / top) * 100) })),
  }
}

/** "coruja" → "a coruja da madrugada"; ids antigos ou desconhecidos aparecem como estão. */
export function archetypeLabel(id: string): string {
  return ARCHETYPES[id as ArchetypeId]?.name ?? id
}

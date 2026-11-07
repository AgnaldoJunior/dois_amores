import { useEffect, useState, type ReactNode } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { Button, ButtonLink } from '@/components/ui/Button'
import { FormMessage } from '@/components/ui/FormMessage'
import { Eyebrow } from '@/components/ui/Typography'
import { useInvalidatePerson } from '@/features/people/api'
import { useProfile, useUpdateProfile } from '@/features/profile/api'
import { ARCHETYPES, QUESTIONS, scoreQuiz, type ArchetypeId } from './archetypes'

const STORAGE_KEY = 'da-quiz-answers'
const TOTAL = QUESTIONS.length

function loadAnswers(): number[] {
  try {
    const raw = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '[]') as unknown
    return Array.isArray(raw) ? raw.filter((n): n is number => typeof n === 'number') : []
  } catch {
    return []
  }
}

function storeAnswers(answers: number[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(answers))
  } catch {
    // sem armazenamento: as respostas ficam só na memória desta tela
  }
}

const two = (n: number) => String(n).padStart(2, '0')

/** /teste/:passo — "qual é o seu lado leitora?": introdução, 15 perguntas e o resultado em anexos. */
export function QuizPage() {
  const { passo } = useParams()
  const [answers, setAnswers] = useState<number[]>(loadAnswers)
  const { data: profile } = useProfile()
  const complete = answers.length >= TOTAL
  const result = complete ? scoreQuiz(answers) : null
  // Sem respostas nesta sessão, quem já tem resultado salvo vê o próprio arquétipo.
  const saved = !result && profile?.archetype ? ARCHETYPES[profile.archetype as ArchetypeId] : undefined

  function answer(question: number, option: number) {
    const next = [...answers.slice(0, question - 1), option]
    setAnswers(next)
    storeAnswers(next)
  }

  if (!passo) return <Intro onStart={() => { setAnswers([]); storeAnswers([]) }} />
  const n = Number(passo)
  if (Number.isInteger(n) && n >= 1 && n <= TOTAL) {
    if (answers.length < n - 1) return <Navigate to={`/teste/${answers.length + 1}`} replace />
    return <Question number={n} chosen={answers[n - 1]} onAnswer={(o) => answer(n, o)} />
  }
  if (!result && !saved) return <Navigate to="/teste" replace />
  const primary = result?.primary ?? saved!

  switch (passo) {
    case 'revelacao':
      return <Reveal />
    case 'resultado':
      return (
        <Page back={{ to: result ? '/teste' : '/perfil', label: result ? 'refazer' : 'perfil' }} label="resultado">
          <Eyebrow>dois amores · {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</Eyebrow>
          <section className="rise flex flex-col gap-3 rounded-card bg-primary p-6 text-inverse">
            <span className="font-sans text-2xs font-semibold uppercase tracking-eyebrow text-blush">você é</span>
            <h1 className="m-0 font-display italic font-bold text-5xl leading-tight">{primary.name}</h1>
            <span className="font-sans text-2xs font-semibold uppercase tracking-eyebrow text-blush">{primary.club}</span>
            <p className="m-0 font-serif italic text-lg leading-snug">{primary.description}</p>
          </section>
          {result && (
            <p className="m-0 font-serif italic text-lg text-muted">
              guardamos também um pouco de <strong className="font-normal text-primary">{result.secondary.name.replace(/^(a|o) /, '')}</strong> em você.
            </p>
          )}
          <ButtonLink to="/teste/dna" className="mt-auto">
            ver meu DNA literário →
          </ButtonLink>
        </Page>
      )
    case 'dna':
      return (
        <Page back={{ to: '/teste/resultado', label: 'resultado' }} label="anexo i · afinidades">
          <Title eyebrow="seu dna" title="seu DNA literário" text="o quanto de cada arquétipo mora em você." />
          <ul aria-label="Afinidades" className="flex flex-col gap-4">
            {(result?.dna ?? [{ archetype: primary, percent: 100 }]).map(({ archetype, percent }) => (
              <li key={archetype.id} className="flex flex-col gap-1.5">
                <span className="flex justify-between font-sans text-md font-medium">
                  <span>{archetype.name}</span>
                  <span className="font-semibold text-primary">{percent}%</span>
                </span>
                <span aria-hidden="true" className="h-progress overflow-hidden rounded-full bg-track">
                  <span className="block h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
                </span>
              </li>
            ))}
          </ul>
          <section className="flex flex-col gap-2 rounded-card border border-line bg-card p-4">
            <Eyebrow>o que isso revela</Eyebrow>
            <p className="m-0 font-sans text-base leading-relaxed">{primary.reveals}</p>
            <Eyebrow className="mt-2">o que vale explorar</Eyebrow>
            <p className="m-0 font-sans text-base leading-relaxed">{primary.explore}</p>
          </section>
          <ButtonLink to="/teste/livros" className="mt-auto">
            ver meus livros →
          </ButtonLink>
        </Page>
      )
    case 'livros':
      return (
        <Page back={{ to: '/teste/dna', label: 'dna' }} label="anexo ii · indicações">
          <Title eyebrow="sua estante" title="sua próxima estante" text="escolhemos estes três pra você ✦" />
          <ol className="flex flex-col">
            {primary.books.map((b, i) => (
              <li key={b.title} className="flex items-start gap-3 border-t border-line py-3.5">
                <span className="font-sans text-sm font-bold text-primary">{two(i + 1)}—</span>
                <span className="flex flex-col">
                  <span className="font-display italic font-semibold text-xl">{b.title}</span>
                  <span className="font-serif italic text-sm text-muted">{b.author}</span>
                  <span className="mt-1 font-sans text-sm text-muted">{b.why}</span>
                </span>
              </li>
            ))}
          </ol>
          <Link to="/buscar" className="font-sans text-sm font-semibold text-primary no-underline">
            buscar esses livros →
          </Link>
          <ButtonLink to="/teste/frase" className="mt-auto">
            continuar →
          </ButtonLink>
        </Page>
      )
    case 'frase':
      return (
        <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-primaryHover px-8 text-center text-inverse">
          <span aria-hidden="true" className="font-display italic text-6xl text-blush">“</span>
          <blockquote className="rise m-0 font-display italic font-semibold text-4xl leading-tight">{primary.quote.text}</blockquote>
          <p className="m-0 font-serif italic text-lg text-blush">
            {primary.quote.author} · {primary.quote.source}
          </p>
          <ButtonLink to="/teste/salvar" fullWidth={false} className="bg-page text-primary hover:bg-tag hover:text-primary">
            continuar →
          </ButtonLink>
        </main>
      )
    case 'salvar':
      return <Save archetype={primary.id} />
    default:
      return <Navigate to="/teste" replace />
  }
}

function Page({ back, label, children }: { back: { to: string; label: string }; label: string; children: ReactNode }) {
  return (
    <main className="min-h-dvh bg-page lg:bg-backdrop lg:py-10">
      <div className="mx-auto flex min-h-dvh max-w-content-max flex-col gap-5 bg-page px-6 pt-4.5 pb-8 lg:min-h-0 lg:rounded-sheet">
        <div className="flex min-h-11 items-center justify-between">
          <Link to={back.to} className="font-sans text-base font-semibold text-primary no-underline">
            ‹ {back.label}
          </Link>
          <span className="font-sans text-2xs font-semibold uppercase tracking-label text-muted">{label}</span>
        </div>
        {children}
      </div>
    </main>
  )
}

function Title({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <header className="rise flex flex-col gap-2">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h1 className="m-0 font-display italic font-semibold text-4xl leading-tight text-primary">{title}</h1>
      <p className="m-0 font-serif italic text-lg text-muted">{text}</p>
    </header>
  )
}

function Intro({ onStart }: { onStart: () => void }) {
  const navigate = useNavigate()
  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden bg-primaryHover px-6 pt-4.5 pb-10 text-inverse">
      <span aria-hidden="true" className="twinkle top-24 right-10 text-xl">✦</span>
      <span aria-hidden="true" className="twinkle twinkle-late top-72 left-8 text-sm">✧</span>
      <div className="mx-auto flex w-full max-w-content-max flex-1 flex-col gap-6">
        <Link to="/" className="min-h-11 self-start pt-2 font-sans text-base font-semibold text-blush no-underline">
          ‹ início
        </Link>
        <Eyebrow className="text-blush">edição especial · dois amores apresenta</Eyebrow>
        <h1 className="rise m-0 font-display italic font-bold text-6xl leading-none">
          qual é o seu
          <br />
          lado leitora?
        </h1>
        <p className="m-0 font-serif italic text-xl text-blush">15 perguntas, 8 arquétipos e um universo literário que é só seu.</p>
        <dl className="m-0 grid grid-cols-3 gap-2 border-y border-primarySoft py-4 text-center">
          {[
            ['15', 'perguntas'],
            ['08', 'arquétipos'],
            ['02', 'minutos'],
          ].map(([n, l]) => (
            <div key={l}>
              <dd className="m-0 font-display italic font-bold text-4xl">{n}</dd>
              <dt className="font-sans text-2xs font-semibold uppercase tracking-label text-blush">{l}</dt>
            </div>
          ))}
        </dl>
        <p className="m-0 text-center font-serif italic text-lg">“sem respostas erradas, só descobertas”</p>
        <div className="mt-auto flex flex-col gap-2">
          <Button
            onClick={() => {
              onStart()
              navigate('/teste/1')
            }}
            className="bg-page text-primary hover:bg-tag hover:text-primary"
          >
            descobrir meu lado leitora →
          </Button>
          <Link to="/" className="flex min-h-11 items-center justify-center font-sans text-sm font-semibold text-blush no-underline">
            deixar para depois
          </Link>
        </div>
      </div>
    </main>
  )
}

function Question({ number, chosen, onAnswer }: { number: number; chosen: number | undefined; onAnswer: (option: number) => void }) {
  const navigate = useNavigate()
  const q = QUESTIONS[number - 1]!
  return (
    <Page back={{ to: number === 1 ? '/teste' : `/teste/${number - 1}`, label: 'voltar' }} label={`pergunta ${two(number)}/${TOTAL}`}>
      <div aria-hidden="true" className="-mt-3 h-1 overflow-hidden rounded-full bg-line">
        <div className="h-full bg-primary" style={{ width: `${(number / TOTAL) * 100}%` }} />
      </div>
      <p className="fade-in m-0 font-serif italic text-lg text-primary">{q.kicker}</p>
      <h1 className="rise m-0 font-display italic font-semibold text-4xl leading-tight text-ink">{q.text}</h1>
      <ol aria-label="Respostas" className="mt-4 flex flex-col">
        {q.options.map((o, i) => (
          <li key={o.label}>
            <button
              type="button"
              aria-pressed={chosen === i}
              onClick={() => {
                onAnswer(i)
                navigate(number < TOTAL ? `/teste/${number + 1}` : '/teste/revelacao')
              }}
              className={`flex min-h-16 w-full items-center gap-3.5 border-t border-ink py-4 text-left ${chosen === i ? 'bg-tag' : ''}`}
            >
              <span className="w-6 shrink-0 font-sans text-sm font-bold text-primary">{String.fromCharCode(65 + i)}—</span>
              <span className="flex-1 font-sans text-lg leading-snug text-ink">{o.label}</span>
              <span aria-hidden="true" className="text-muted">
                →
              </span>
            </button>
          </li>
        ))}
      </ol>
      <div className="mt-auto flex justify-between border-t border-ink pt-3 font-sans text-2xs font-semibold uppercase tracking-label text-muted">
        <span>dois amores · teste de leitora</span>
        <span className="text-primary">
          {two(number)} / {TOTAL}
        </span>
      </div>
    </Page>
  )
}

function Reveal() {
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 1800)
    return () => clearTimeout(t)
  }, [])
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center gap-6 overflow-hidden bg-primaryHover px-8 text-center text-inverse">
      <span aria-hidden="true" className="twinkle top-1/4 left-1/4 text-2xl">✦</span>
      <span aria-hidden="true" className="twinkle twinkle-late top-1/3 right-1/4 text-lg">✧</span>
      <span aria-hidden="true" className="twinkle twinkle-later bottom-1/3 left-1/3 text-xl">✦</span>
      <Eyebrow className="text-blush">✦ a revelação ✦</Eyebrow>
      <h1 className="m-0 font-display italic font-bold text-5xl leading-tight">
        montando seu
        <br />
        universo literário…
      </h1>
      <p role="status" className="m-0 font-serif italic text-lg text-blush">
        {ready ? 'pronto ✧' : 'lendo suas quinze respostas com atenção.'}
      </p>
      <Button fullWidth={false} disabled={!ready} onClick={() => navigate('/teste/resultado')} className="bg-page text-primary hover:bg-tag hover:text-primary">
        ver meu resultado →
      </Button>
    </main>
  )
}

function Save({ archetype }: { archetype: ArchetypeId }) {
  const navigate = useNavigate()
  const update = useUpdateProfile()
  const invalidate = useInvalidatePerson()
  const [consent, setConsent] = useState(false)
  const [error, setError] = useState('')

  async function onSave() {
    setError('')
    try {
      await update.mutateAsync({ archetype })
      invalidate()
      navigate('/perfil', { replace: true })
    } catch {
      setError('Não foi possível salvar agora. Tente de novo.')
    }
  }

  return (
    <Page back={{ to: '/teste/frase', label: 'frase' }} label="último passo">
      <Title eyebrow="para guardar no seu perfil" title="posso guardar isso?" text="só salvamos com a sua permissão. nada sai daqui sem você escolher." />
      <label className="flex cursor-pointer items-start gap-3 rounded-card border border-line bg-card p-4">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 size-5 accent-primary" />
        <span className="font-sans text-base leading-relaxed">quero salvar meu arquétipo no meu perfil</span>
      </label>
      <section className="flex flex-col gap-1.5">
        <Eyebrow>o que fica salvo</Eyebrow>
        <p className="m-0 font-sans text-base text-muted">o arquétipo principal, que aparece como selo no seu perfil. As respostas não são guardadas.</p>
      </section>
      {error && <FormMessage tone="error">{error}</FormMessage>}
      <div className="mt-auto flex flex-col gap-2">
        <Button onClick={onSave} disabled={!consent} loading={update.isPending}>
          salvar meu universo literário →
        </Button>
        {!consent && <p className="m-0 text-center font-serif italic text-sm text-muted">marque a caixa para liberar ✧</p>}
        <Link to="/" className="flex min-h-11 items-center justify-center font-sans text-sm font-semibold text-muted no-underline">
          pular por agora
        </Link>
      </div>
    </Page>
  )
}

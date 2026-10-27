import { useState, type FormEvent } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { BookSearch } from '@/components/BookSearch'
import { BookCover } from '@/components/ui/BookCover'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { FormMessage } from '@/components/ui/FormMessage'
import { RatingInput } from '@/components/ui/RatingInput'
import { TextAreaField, TextField } from '@/components/ui/TextField'
import { PageTitle } from '@/components/ui/Typography'
import { useCurrentUser } from '@/lib/auth/AuthProvider'
import { todayIso } from '@/lib/dates'
import type { BookSearchResult } from '@/lib/openlibrary/client'
import { useBook } from '@/features/shelf/api'
import { AI_DISCLAIMER, QuoteSuggestions } from './QuoteSuggestions'
import { ensureBook, findMyReadingId, useDeleteReading, useReading, useSaveReading, type Book } from './api'
import {
  fromReadingValues,
  RANK_FIELDS,
  toReadingValues,
  validateReading,
  type ReadingErrors,
  type ReadingForm,
} from './validation'

const emptyForm = (): ReadingForm => ({
  started_on: todayIso(),
  finished_on: '',
  rank_characters: null,
  rank_plot: null,
  rank_writing: null,
  rank_ending: null,
  favorite_character: '',
  favorite_quote: '',
  comment: '',
})

/** /publicar (nova leitura) e /leituras/:id/editar */
export function ReadingFormPage() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const presetBookId = params.get('livro')
  if (id) return <EditReadingLoader id={id} />
  if (presetBookId) return <PresetBookLoader bookId={presetBookId} />
  return <ReadingEditor key="new" initialBook={null} initialForm={emptyForm()} />
}

/** /publicar?livro=<id>: vindo da página do livro ou da lista "Quero ler". */
function PresetBookLoader({ bookId }: { bookId: string }) {
  const { data, isLoading } = useBook(bookId)
  if (isLoading) return <p className="font-hand text-lg text-primary">Carregando livro…</p>
  return <ReadingEditor key={bookId} initialBook={data ?? null} initialForm={emptyForm()} />
}

function EditReadingLoader({ id }: { id: string }) {
  const { data, isLoading, isError } = useReading(id)
  if (isLoading) return <p className="font-hand text-lg text-primary">Carregando leitura…</p>
  if (isError || !data) return <FormMessage tone="error">Leitura não encontrada.</FormMessage>
  return <ReadingEditor key={id} readingId={id} initialBook={data.book} initialForm={fromReadingValues(data)} />
}

type EditorProps = {
  readingId?: string
  initialBook: Book | null
  initialForm: ReadingForm
}

function ReadingEditor({ readingId, initialBook, initialForm }: EditorProps) {
  const user = useCurrentUser()
  const navigate = useNavigate()
  const save = useSaveReading()
  const remove = useDeleteReading()
  const isEdit = Boolean(readingId)

  const [book, setBook] = useState<Book | null>(initialBook)
  const [bookLoading, setBookLoading] = useState(false)
  const [form, setForm] = useState<ReadingForm>(initialForm)
  const [errors, setErrors] = useState<ReadingErrors>({})
  const [formError, setFormError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  /** A citação no campo veio de uma sugestão da IA e ainda não foi editada. */
  const [quoteFromAi, setQuoteFromAi] = useState(false)

  const set = <K extends keyof ReadingForm>(key: K, value: ReadingForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  async function onSelectBook(result: BookSearchResult) {
    setFormError('')
    setBookLoading(true)
    try {
      const saved = await ensureBook(result)
      const existing = await findMyReadingId(user.id, saved.id)
      if (existing) {
        navigate(`/leituras/${existing}/editar`, { replace: true })
        return
      }
      setBook(saved)
      setErrors((e) => ({ ...e, book: undefined }))
    } catch {
      setFormError('Não foi possível carregar este livro. Tente de novo.')
    } finally {
      setBookLoading(false)
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const found = validateReading(form, Boolean(book), todayIso())
    setErrors(found)
    if (Object.keys(found).length > 0 || !book) return
    setFormError('')
    try {
      await save.mutateAsync({ id: readingId, bookId: book.id, values: toReadingValues(form) })
      navigate(`/livros/${book.id}`, {
        replace: true,
        state: {
          flash: form.finished_on
            ? 'Leitura publicada no feed!'
            : 'Leitura salva. Quando terminar, preencha a data de fim para publicar no feed.',
        },
      })
    } catch (err) {
      setFormError(
        (err as { code?: string }).code === '23505'
          ? 'Você já registrou este livro. Abra-o em Meus livros para editar.'
          : 'Não foi possível salvar. Tente de novo.',
      )
    }
  }

  async function onDelete() {
    if (!readingId) return
    try {
      await remove.mutateAsync(readingId)
      navigate('/meus-livros', { replace: true })
    } catch {
      setFormError('Não foi possível excluir. Tente de novo.')
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <PageTitle>{isEdit ? 'Editar leitura' : 'Publicar leitura'}</PageTitle>

      {book ? (
        <Card className="flex items-center gap-3 p-3">
          <BookCover title={book.title} url={book.cover_url} size="sm" decorative />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="font-display text-title-md uppercase leading-none text-primary">{book.title}</p>
            {book.author && <p className="font-mono text-xs uppercase text-primary">{book.author}</p>}
            {book.pages && <p className="font-mono text-xs uppercase text-primary">{book.pages} páginas</p>}
            {!isEdit && (
              <button
                type="button"
                onClick={() => setBook(null)}
                className="self-start font-sans text-sm text-primary underline underline-offset-4"
              >
                Trocar livro
              </button>
            )}
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-1">
          <BookSearch onSelect={onSelectBook} disabled={bookLoading} />
          {bookLoading && <p className="font-hand text-lg text-primary">Salvando livro…</p>}
          {errors.book && <p className="font-sans text-sm text-danger">{errors.book}</p>}
        </div>
      )}

      <TextField
        label="Início da leitura *"
        type="date"
        required
        max={todayIso()}
        value={form.started_on}
        error={errors.started_on}
        onChange={(e) => set('started_on', e.target.value)}
      />
      <TextField
        label="Fim da leitura"
        type="date"
        max={todayIso()}
        min={form.started_on || undefined}
        hint="pode deixar em branco e preencher quando terminar"
        value={form.finished_on}
        error={errors.finished_on}
        onChange={(e) => set('finished_on', e.target.value)}
      />

      <div className="flex flex-col gap-4 py-1">
        {RANK_FIELDS.map(({ key, label }) => (
          <RatingInput key={key} label={label} value={form[key]} onChange={(v) => set(key, v)} />
        ))}
      </div>

      <TextField
        label="Personagem favorito"
        maxLength={200}
        value={form.favorite_character}
        onChange={(e) => set('favorite_character', e.target.value)}
      />
      <TextAreaField
        label="Citação favorita"
        maxLength={2000}
        rows={2}
        value={form.favorite_quote}
        hint={quoteFromAi ? AI_DISCLAIMER : undefined}
        onChange={(e) => {
          set('favorite_quote', e.target.value)
          setQuoteFromAi(false)
        }}
      />
      <QuoteSuggestions
        bookId={book?.id ?? null}
        onUse={(quote) => {
          set('favorite_quote', quote)
          setQuoteFromAi(true)
        }}
      />
      <TextAreaField
        label="Comentário"
        maxLength={5000}
        rows={3}
        value={form.comment}
        onChange={(e) => set('comment', e.target.value)}
      />

      {formError && <FormMessage tone="error">{formError}</FormMessage>}

      <Button type="submit" loading={save.isPending} className="text-base">
        SALVAR
      </Button>

      {isEdit &&
        (confirmDelete ? (
          <div className="flex flex-col gap-2">
            <Button variant="danger" onClick={onDelete} loading={remove.isPending}>
              Sim, excluir esta leitura
            </Button>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              Cancelar
            </Button>
          </div>
        ) : (
          <Button variant="outline" onClick={() => setConfirmDelete(true)}>
            Excluir leitura
          </Button>
        ))}
    </form>
  )
}

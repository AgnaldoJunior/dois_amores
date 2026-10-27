import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { BookSearch } from '@/components/BookSearch'
import { BookCover } from '@/components/ui/BookCover'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { FormMessage } from '@/components/ui/FormMessage'
import { PageTitle, SectionTitle } from '@/components/ui/Typography'
import { groupClubBooks } from '@/lib/domain/clubs'
import { coverUrl, type BookSearchResult } from '@/lib/openlibrary/client'
import { useClub, useProposeBook } from './api'
import { clubPath } from './ClubsPage'
import { ProposalCard } from './components'

export const proposeErrorMessage = (err: unknown) =>
  (err as { code?: string }).code === '23505'
    ? 'Esse livro já está no clube ou aguardando aprovação.'
    : 'Não foi possível propor agora. Tente de novo.'

/** /clubes/:clubId/propor (Figma 11): busca igual à do formulário de leitura + propostas pendentes. */
export function ProposePage() {
  const { clubId = '' } = useParams()
  const navigate = useNavigate()
  const { data: club } = useClub(clubId)
  const propose = useProposeBook(clubId)
  const [selected, setSelected] = useState<BookSearchResult | null>(null)
  const [error, setError] = useState('')

  async function onPropose() {
    if (!selected) return
    setError('')
    try {
      await propose.mutateAsync({
        workKey: selected.workKey,
        title: selected.title,
        author: selected.author,
        pages: selected.pages,
        coverUrl: selected.coverId ? coverUrl(selected.coverId, 'L') : null,
      })
      navigate(clubPath(clubId), {
        state: { flash: 'Proposta enviada! O livro entra no clube quando todos aprovarem.' },
      })
    } catch (err) {
      setError(proposeErrorMessage(err))
    }
  }

  const pending = club ? groupClubBooks(club.books).pending : []

  return (
    <div className="flex flex-col gap-4">
      <PageTitle>Propor livro</PageTitle>

      {selected ? (
        <Card className="flex flex-col gap-3">
          <div className="flex gap-3">
            <BookCover title={selected.title} url={selected.coverId ? coverUrl(selected.coverId, 'M') : null} size="sm" decorative />
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
              <h2 className="font-display text-title-sm uppercase leading-none text-primary">{selected.title}</h2>
              {selected.author && <p className="font-mono text-xs text-primary">{selected.author}</p>}
            </div>
          </div>
          <Button onClick={onPropose} loading={propose.isPending} className="text-base">
            PROPOR AO CLUBE
          </Button>
          <button type="button" onClick={() => setSelected(null)} className="self-start font-sans text-sm text-primary underline underline-offset-4">
            Escolher outro livro
          </button>
        </Card>
      ) : (
        <BookSearch onSelect={setSelected} />
      )}
      {error && <FormMessage tone="error">{error}</FormMessage>}
      <p className="font-sans text-sm text-primary">
        Você já aprova o livro ao propor. Ele entra no clube quando todos os membros aprovarem; uma recusa descarta a proposta.
      </p>

      {club && pending.length > 0 && (
        <section className="flex flex-col gap-3" aria-labelledby="pending-title">
          <SectionTitle>
            <span id="pending-title">Aguardando aprovação</span>
          </SectionTitle>
          <ul className="flex flex-col gap-3">
            {pending.map((cb) => (
              <li key={cb.id}>
                <ProposalCard clubBook={cb} members={club.members} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <Link to={clubPath(clubId)} className="self-center font-sans text-sm text-primary underline underline-offset-4">
        Voltar para o clube
      </Link>
    </div>
  )
}

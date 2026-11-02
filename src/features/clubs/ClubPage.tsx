import { useState, type ChangeEvent } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { Avatar, avatarOf } from '@/components/ui/Avatar'
import { Button, ButtonLink, buttonClass } from '@/components/ui/Button'
import { BookCover } from '@/components/ui/BookCover'
import { Card } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'
import { EmptyState } from '@/components/ui/EmptyState'
import { FormMessage } from '@/components/ui/FormMessage'
import { Stars } from '@/components/ui/Stars'
import { Label, SectionTitle } from '@/components/ui/Typography'
import { AVATAR_ACCEPT, validateAvatarFile } from '@/features/profile/imageResize'
import { useCurrentUser } from '@/lib/auth/AuthProvider'
import { useBackgroundEnrichment } from '@/lib/books/useBackgroundEnrichment'
import { formatDayMonth, formatMonthYear } from '@/lib/dates'
import { clubBookAverage, formatEdition, groupClubBooks, plannedEditions } from '@/lib/domain/clubs'
import { withPet } from '@/lib/pets'
import { mostLoved } from '@/lib/domain/ranking'
import { formatAverage } from '@/lib/domain/ratings'
import {
  useChangeClubCover,
  useClub,
  useFinishClubBook,
  useLeaveClub,
  useRegenerateInviteCode,
  type ClubBook,
  type ClubDetail,
  type ClubMember,
} from './api'
import { clubBookPath } from './ClubReviewPage'
import { clubPath } from './ClubsPage'
import { ClubBookGrid, ClubBookTile, ProposalCard } from './components'

/** /clubes/:clubId (Figma 09). */
export function ClubPage() {
  const { clubId = '' } = useParams()
  const location = useLocation()
  const flash = (location.state as { flash?: string } | null)?.flash
  const { data: club, isLoading, isError } = useClub(clubId)
  useBackgroundEnrichment(club?.books.map((cb) => cb.book))

  if (isLoading) return <p className="font-hand text-lg text-primary">Abrindo o clube…</p>
  if (isError || !club) return <FormMessage tone="error">Clube não encontrado ou você não participa dele.</FormMessage>

  const memberIds = club.members.map((m) => m.user_id)
  const groups = groupClubBooks(club.books)
  const planned = plannedEditions(club.books)

  return (
    <div className="flex flex-col gap-4">
      <ClubHeader club={club} />
      {flash && <FormMessage tone="success">{flash}</FormMessage>}

      <section aria-label="Membros" className="flex flex-wrap justify-around gap-2">
        {club.members.map((m) => (
          <Link
            key={m.user_id}
            to={`${clubPath(club.id)}/membros/${m.user_id}`}
            aria-label={`${m.profile.name}${m.role === 'owner' ? ' (criou o clube)' : ''}`}
            className="flex min-w-15 flex-col items-center gap-0.5 no-underline"
          >
            <Avatar {...avatarOf(m.profile)} size="md" />
            <span className="font-hand text-base leading-none">{withPet(m.profile.name.split(/\s+/)[0]!, m.profile.pet)}</span>
          </Link>
        ))}
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="club-reading">
        <SectionTitle>
          <span id="club-reading">Em andamento</span>
        </SectionTitle>
        {groups.reading.length === 0 ? (
          <EmptyState>Nenhum livro em leitura. Proponha o próximo!</EmptyState>
        ) : (
          <ul aria-label="Livros em leitura no clube" className="flex flex-col gap-3">
            {groups.reading.map((cb) => (
              <li key={cb.id}>
                <CurrentBookCard clubId={club.id} clubBook={cb} members={club.members} edition={planned.get(cb.id)} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {groups.queued.length > 0 && (
        <section className="flex flex-col gap-2.5" aria-labelledby="club-next">
          <SectionTitle aside={groups.queued.length}>
            <span id="club-next">Próximas</span>
          </SectionTitle>
          <ol className="flex flex-col gap-2">
            {groups.queued.map((cb) => (
              <li key={cb.id}>
                <NextBook clubBook={cb} members={club.members} edition={planned.get(cb.id)} />
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="flex flex-col gap-3" aria-labelledby="club-finished">
        <SectionTitle aside={groups.finished.length || undefined}>
          <span id="club-finished">Concluídos</span>
        </SectionTitle>
        {groups.finished.length === 0 ? (
          <EmptyState>As edições concluídas vão aparecer aqui.</EmptyState>
        ) : (
          <ClubBookGrid label="Livros concluídos no clube">
            {groups.finished.map((cb) => (
              <ClubBookTile
                key={cb.id}
                clubBook={cb}
                to={clubBookPath(club.id, cb.id)}
                average={clubBookAverage(cb.book.id, club.readings, memberIds)}
                footer={<Label className="text-2xs">{formatEdition(cb.edition_number)}</Label>}
              />
            ))}
          </ClubBookGrid>
        )}
      </section>

      <MostLoved clubId={club.id} books={groups.finished} readings={club.readings} memberIds={memberIds} />

      {groups.pending.length > 0 && (
        <section className="flex flex-col gap-3" aria-labelledby="club-pending">
          <SectionTitle>
            <span id="club-pending">Aguardando aprovação</span>
          </SectionTitle>
          <ul className="flex flex-col gap-3">
            {groups.pending.map((cb) => (
              <li key={cb.id}>
                <ProposalCard clubBook={cb} members={club.members} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid grid-cols-2 gap-2.5">
        <ButtonLink to={`${clubPath(club.id)}/propor`}>
          <Icon name="plus" className="size-icon-sm" />
          PROPOR LIVRO
        </ButtonLink>
        <ButtonLink to={`${clubPath(club.id)}/revista`} variant="secondary">
          <Icon name="magazine" className="size-icon-sm" />
          EXPORTAR REVISTA
        </ButtonLink>
        <ButtonLink to={`${clubPath(club.id)}/ranking`} variant="outline">
          <Icon name="trophy" className="size-icon-sm" />
          RANKING
        </ButtonLink>
        <ButtonLink to={`${clubPath(club.id)}/sugestoes`} variant="outline">
          <Icon name="sparkle" className="size-icon-sm" />
          SUGESTÃO DO CLUBE
        </ButtonLink>
      </div>

      <ClubSettings club={club} />
    </div>
  )
}

function ClubHeader({ club }: { club: ClubDetail }) {
  const [copied, setCopied] = useState(false)
  const canShare = typeof navigator !== 'undefined' && 'share' in navigator
  const invite = `Entre no clube "${club.name}" no Dois Amores com o código ${club.invite_code}: ${window.location.origin}/clubes`

  async function copy() {
    try {
      await navigator.clipboard.writeText(club.invite_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <header className="stripes relative -mx-5 -mt-12 flex min-h-club-header flex-col items-center justify-end gap-2 px-4 pt-24 pb-4 lg:mx-0 lg:mt-0 lg:rounded-card">
      <Link
        to="/clubes"
        aria-label="Voltar para clubes"
        className="absolute top-11 left-3.5 flex size-pill-h items-center justify-center rounded-full border border-primary bg-page"
      >
        <Icon name="back" className="size-icon-sm" />
      </Link>
      <Button
        variant={copied ? 'primary' : 'outline'}
        fullWidth={false}
        onClick={copy}
        aria-live="polite"
        className="absolute top-11 right-3.5 min-h-pill-h rounded-full bg-page px-3 text-2xs"
      >
        {copied ? 'CÓDIGO COPIADO ✓' : 'COPIAR CÓDIGO'}
      </Button>
      <div className="ticket tilt-l2 flex flex-col items-center bg-primary px-8 pt-2 pb-0.5">
        <span aria-hidden="true" className="font-display text-5xl leading-none text-inverse">Book Club</span>
        <h1 className="-mt-2 font-script font-normal text-3xl leading-none text-pill">{club.name}</h1>
      </div>
      <p className="rounded-xs bg-page px-2 py-0.5 font-mono font-bold text-2xs uppercase tracking-label">
        código <strong className="font-bold">{club.invite_code}</strong>
      </p>
      {canShare && (
        <button
          type="button"
          onClick={() => navigator.share({ title: club.name, text: invite }).catch(() => undefined)}
          className="font-hand text-md text-primary underline underline-offset-4"
        >
          Compartilhar convite
        </button>
      )}
    </header>
  )
}

/** Quem escolheu o livro, com o bichinho: "escolha de 🐭 Irla". */
function chooserOf(clubBook: ClubBook, members: ClubMember[]) {
  const p = members.find((m) => m.user_id === clubBook.proposed_by)?.profile
  return p ? `${p.pet ? `${p.pet} ` : ''}${p.name.split(/\s+/)[0]}` : null
}

/** Livro na fila: número planejado, capa, título e quem escolheu. */
function NextBook({ clubBook, members, edition }: { clubBook: ClubBook; members: ClubMember[]; edition?: number }) {
  const chooser = chooserOf(clubBook, members)
  return (
    <article className="flex items-center gap-3 rounded-card border border-dashed border-primary bg-page p-2 pr-3">
      <span className="tilt-l2 w-12 shrink-0 text-center font-mono font-bold text-xs uppercase tracking-label text-accentStrong">
        {formatEdition(edition)}
      </span>
      <BookCover title={clubBook.book.title} url={clubBook.book.cover_url} size="xs" decorative />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <h3 className="truncate font-type font-normal text-sm">{clubBook.book.title}</h3>
        {chooser && <p className="font-hand text-md leading-none">escolha de {chooser}</p>}
      </div>
    </article>
  )
}

/** Livro em leitura: selo, mês e edição, quem escolheu, reviews e concluir. */
function CurrentBookCard({ clubId, clubBook, members, edition }: { clubId: string; clubBook: ClubBook; members: ClubMember[]; edition?: number }) {
  const chooser = chooserOf(clubBook, members)
  const stamp = [formatMonthYear(clubBook.started_on), formatEdition(clubBook.edition_number ?? edition), chooser && `escolha de ${chooser}`]
    .filter(Boolean)
    .join(' · ')
  return (
    <article className="flex gap-3.5 rounded-card border border-primary bg-card p-3">
      <Link to={clubBookPath(clubId, clubBook.id)} aria-label={clubBook.book.title} className="shrink-0">
        <BookCover title={clubBook.book.title} url={clubBook.book.cover_url} size="stamp" stamp decorative />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        {stamp && <Label className="text-2xs text-accentStrong">{stamp}</Label>}
        <h3 className="self-start rounded-pill bg-pill px-2.5 py-0.5 font-type font-normal text-sm leading-tight">{clubBook.book.title}</h3>
        {clubBook.book.author && <p className="font-hand text-md leading-none">{clubBook.book.author}</p>}
        <ButtonLink to={clubBookPath(clubId, clubBook.id)} fullWidth={false} className="mt-auto self-start min-h-button-sm-h text-2xs">
          reviews do clube
        </ButtonLink>
        <FinishButton clubBookId={clubBook.id} startedOn={clubBook.started_on} />
      </div>
    </article>
  )
}

/** Top 3 do clube pela média das médias. */
function MostLoved({ clubId, books, readings, memberIds }: { clubId: string; books: ClubBook[]; readings: ClubDetail['readings']; memberIds: string[] }) {
  const top = mostLoved(books, readings, memberIds)
  if (top.length === 0) return null
  return (
    <section className="flex flex-col gap-2.5" aria-labelledby="club-loved">
      <SectionTitle>
        <span id="club-loved">Os mais amados</span>
      </SectionTitle>
      <ol className="flex flex-col gap-2">
        {top.map((cb, i) => (
          <li key={cb.id}>
            <Link to={clubBookPath(clubId, cb.id)} className="flex items-center gap-3 rounded-card border border-primary bg-card p-2 pr-3 no-underline">
              <span className="w-6 text-center font-display text-4xl leading-none text-accentStrong">{i + 1}</span>
              <BookCover title={cb.book.title} url={cb.book.cover_url} size="xs" decorative />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate font-type text-sm">{cb.book.title}</span>
                <Stars value={cb.average} size="sm" />
              </span>
              <span className="font-display text-2xl">{formatAverage(cb.average)}</span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  )
}

function FinishButton({ clubBookId, startedOn }: { clubBookId: string; startedOn: string | null }) {
  const finish = useFinishClubBook()
  const [confirm, setConfirm] = useState(false)
  return (
    <div className="flex flex-col gap-1">
      {startedOn && <Label className="text-2xs">lendo desde {formatDayMonth(startedOn)}</Label>}
      {confirm ? (
        <span className="flex gap-2">
          <button type="button" className="font-hand text-md text-primary underline" onClick={() => finish.mutate(clubBookId)}>
            {finish.isPending ? 'salvando…' : 'confirmar'}
          </button>
          <button type="button" className="font-hand text-md text-primary" onClick={() => setConfirm(false)}>
            cancelar
          </button>
        </span>
      ) : (
        <button type="button" className="font-hand text-md text-primary underline" onClick={() => setConfirm(true)}>
          concluir leitura
        </button>
      )}
    </div>
  )
}

function ClubSettings({ club }: { club: ClubDetail }) {
  const user = useCurrentUser()
  const navigate = useNavigate()
  const isOwner = club.members.some((m) => m.user_id === user.id && m.role === 'owner')
  const regenerate = useRegenerateInviteCode(club.id)
  const changeCover = useChangeClubCover(club.id)
  const leave = useLeaveClub(club.id)
  const [confirmLeave, setConfirmLeave] = useState(false)
  const [error, setError] = useState('')

  async function onCover(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const invalid = validateAvatarFile(file)
    if (invalid) return setError(invalid)
    setError('')
    await changeCover.mutateAsync(file).catch(() => setError('Não foi possível trocar a capa.'))
  }

  async function onLeave() {
    try {
      await leave.mutateAsync({ asOwner: isOwner })
      navigate('/clubes', { replace: true, state: { flash: isOwner ? 'Clube excluído.' : 'Você saiu do clube.' } })
    } catch {
      setError('Não foi possível concluir agora. Tente de novo.')
    }
  }

  return (
    <Card className="flex flex-col gap-3">
      <SectionTitle>{isOwner ? 'Gerenciar clube' : 'Participação'}</SectionTitle>
      {isOwner && (
        <>
          <label className={buttonClass('outline', true, 'cursor-pointer focus-within:outline focus-within:outline-primary')}>
            {changeCover.isPending ? 'Enviando capa…' : 'Trocar capa'}
            <input type="file" accept={AVATAR_ACCEPT} className="sr-only" onChange={onCover} />
          </label>
          <Button variant="outline" loading={regenerate.isPending} onClick={() => regenerate.mutate()}>
            Gerar novo código
          </Button>
          <p className="font-hand text-md">O código antigo deixa de funcionar; quem já entrou continua no clube.</p>
        </>
      )}
      {confirmLeave ? (
        <div className="flex flex-col gap-2">
          <p className="font-hand text-md">
            {isOwner
              ? 'Excluir o clube apaga as prateleiras, propostas e votos de todos. As leituras pessoais continuam.'
              : 'Você sai do clube; suas leituras continuam no seu perfil.'}
          </p>
          <Button variant="danger" loading={leave.isPending} onClick={onLeave}>
            {isOwner ? 'Sim, excluir o clube' : 'Sim, sair do clube'}
          </Button>
          <Button variant="outline" onClick={() => setConfirmLeave(false)}>
            Cancelar
          </Button>
        </div>
      ) : (
        <Button variant="outline" onClick={() => setConfirmLeave(true)}>
          {isOwner ? 'Excluir clube' : 'Sair do clube'}
        </Button>
      )}
      {error && <FormMessage tone="error">{error}</FormMessage>}
    </Card>
  )
}

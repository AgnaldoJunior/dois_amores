import { useState, type ChangeEvent } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { Avatar } from '@/components/ui/Avatar'
import { Button, ButtonLink, buttonClass } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'
import { EmptyState } from '@/components/ui/EmptyState'
import { FormMessage } from '@/components/ui/FormMessage'
import { Label, SectionTitle } from '@/components/ui/Typography'
import { AVATAR_ACCEPT, validateAvatarFile } from '@/features/profile/imageResize'
import { useCurrentUser } from '@/lib/auth/AuthProvider'
import { useBackgroundEnrichment } from '@/lib/books/useBackgroundEnrichment'
import { formatDayMonth } from '@/lib/dates'
import { clubBookAverage, formatEdition, groupClubBooks } from '@/lib/domain/clubs'
import {
  useChangeClubCover,
  useClub,
  useFinishClubBook,
  useLeaveClub,
  useRegenerateInviteCode,
  type ClubDetail,
} from './api'
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
            <Avatar name={m.profile.name} url={m.profile.avatar_url} size="md" />
            <span className="font-hand text-base leading-none">{m.profile.name.split(/\s+/)[0]}</span>
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
          <ClubBookGrid label="Livros em leitura no clube">
            {groups.reading.map((cb) => (
              <ClubBookTile key={cb.id} clubBook={cb} footer={<FinishButton clubBookId={cb.id} startedOn={cb.started_on} />} />
            ))}
          </ClubBookGrid>
        )}
      </section>

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
                average={clubBookAverage(cb.book.id, club.readings, memberIds)}
                footer={<Label className="text-2xs">{formatEdition(cb.edition_number)}</Label>}
              />
            ))}
          </ClubBookGrid>
        )}
      </section>

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
        <ButtonLink to={`${clubPath(club.id)}/sugestoes`} variant="outline" className="col-span-2">
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

function FinishButton({ clubBookId, startedOn }: { clubBookId: string; startedOn: string | null }) {
  const finish = useFinishClubBook()
  const [confirm, setConfirm] = useState(false)
  return (
    <div className="flex flex-col gap-1">
      {startedOn && <Label className="text-2xs">desde {formatDayMonth(startedOn)}</Label>}
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

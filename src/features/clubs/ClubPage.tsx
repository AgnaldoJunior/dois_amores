import { useState, type ChangeEvent } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { Avatar } from '@/components/ui/Avatar'
import { BookCover } from '@/components/ui/BookCover'
import { Button, ButtonLink, buttonClass } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { FormMessage } from '@/components/ui/FormMessage'
import { Label, SectionTitle } from '@/components/ui/Typography'
import { AVATAR_ACCEPT, validateAvatarFile } from '@/features/profile/imageResize'
import { useCurrentUser } from '@/lib/auth/AuthProvider'
import { useBackgroundEnrichment } from '@/lib/books/useBackgroundEnrichment'
import { formatDateShort } from '@/lib/dates'
import { clubBookAverage, groupClubBooks } from '@/lib/domain/clubs'
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
    <div className="flex flex-col gap-5">
      {flash && <FormMessage tone="success">{flash}</FormMessage>}
      <ClubHeader club={club} />

      <section aria-label="Membros" className="flex flex-wrap gap-2">
        {club.members.map((m) => (
          <Link
            key={m.user_id}
            to={`${clubPath(club.id)}/membros/${m.user_id}`}
            aria-label={`${m.profile.name}${m.role === 'owner' ? ' (criou o clube)' : ''}`}
            className="rounded-full"
          >
            <Avatar name={m.profile.name} url={m.profile.avatar_url} size="sm" />
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
              <li key={cb.id}>
                <ClubBookTile clubBook={cb} footer={<FinishButton clubBookId={cb.id} startedOn={cb.started_on} />} />
              </li>
            ))}
          </ClubBookGrid>
        )}
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="club-finished">
        <SectionTitle>
          <span id="club-finished">Concluídos</span>
        </SectionTitle>
        {groups.finished.length === 0 ? (
          <EmptyState>As edições concluídas vão aparecer aqui.</EmptyState>
        ) : (
          <ClubBookGrid label="Livros concluídos no clube">
            {groups.finished.map((cb) => (
              <li key={cb.id}>
                <ClubBookTile
                  clubBook={cb}
                  average={clubBookAverage(cb.book.id, club.readings, memberIds)}
                  footer={
                    <Label className="text-2xs tracking-normal">
                      Edição {cb.edition_number} · {formatDateShort(cb.finished_on).slice(3)}
                    </Label>
                  }
                />
              </li>
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

      <div className="flex flex-col gap-3">
        <ButtonLink to={`${clubPath(club.id)}/propor`} className="text-base">
          PROPOR LIVRO
        </ButtonLink>
        <ButtonLink to={`${clubPath(club.id)}/sugestoes`} variant="outline" className="text-base">
          SUGESTÃO DO CLUBE
        </ButtonLink>
        <ButtonLink to={`${clubPath(club.id)}/revista`} variant="outline" className="text-base">
          EXPORTAR REVISTA
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
    <header className="flex items-center gap-4">
      <BookCover title={club.name} url={club.cover_url} size="sm" decorative />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <h1 className="font-script text-4xl leading-tight text-primary">{club.name}</h1>
        <p className="font-mono text-xs uppercase tracking-label text-primary">
          Código: <strong className="font-mono">{club.invite_code}</strong>
        </p>
        <Button variant="outline" onClick={copy} aria-live="polite">
          {copied ? 'CÓDIGO COPIADO ✓' : 'COPIAR CÓDIGO'}
        </Button>
        {canShare && (
          <button
            type="button"
            onClick={() => navigator.share({ title: club.name, text: invite }).catch(() => undefined)}
            className="self-start font-sans text-sm text-primary underline underline-offset-4"
          >
            Compartilhar convite
          </button>
        )}
      </div>
    </header>
  )
}

function FinishButton({ clubBookId, startedOn }: { clubBookId: string; startedOn: string | null }) {
  const finish = useFinishClubBook()
  const [confirm, setConfirm] = useState(false)
  return (
    <div className="flex flex-col gap-1">
      {startedOn && <Label className="text-2xs tracking-normal">desde {formatDateShort(startedOn)}</Label>}
      {confirm ? (
        <span className="flex gap-2">
          <button type="button" className="font-sans text-sm text-primary underline" onClick={() => finish.mutate(clubBookId)}>
            {finish.isPending ? 'salvando…' : 'confirmar'}
          </button>
          <button type="button" className="font-sans text-sm text-primary" onClick={() => setConfirm(false)}>
            cancelar
          </button>
        </span>
      ) : (
        <button type="button" className="self-start font-sans text-sm text-primary underline" onClick={() => setConfirm(true)}>
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
          <p className="font-sans text-sm text-primary">O código antigo deixa de funcionar; quem já entrou continua no clube.</p>
        </>
      )}
      {confirmLeave ? (
        <div className="flex flex-col gap-2">
          <p className="font-sans text-sm text-primary">
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

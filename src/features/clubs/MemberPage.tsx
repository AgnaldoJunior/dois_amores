import { useParams } from 'react-router'
import { FormMessage } from '@/components/ui/FormMessage'
import { BookLoading } from '@/components/ui/Loading'
import { Eyebrow, HandText } from '@/components/ui/Typography'
import { usePerson } from '@/features/people/api'
import { ProfileView } from '@/features/people/ProfileView'
import { formatEdition } from '@/lib/domain/clubs'
import { MONTH_NAMES } from '@/lib/domain/year'
import { useClub } from './api'
import { clubPath } from './ClubsPage'

/** /clubes/:clubId/membros/:userId — perfil de um membro, com a participação no clube. */
export function MemberPage() {
  const { clubId = '', userId = '' } = useParams()
  const { data: person, isLoading, isError } = usePerson(userId)
  const { data: club } = useClub(clubId)

  if (isLoading) return <BookLoading label="abrindo o perfil…" />
  if (isError || !person) return <FormMessage tone="error">Membro não encontrado.</FormMessage>

  const member = club?.members.find((m) => m.user_id === userId)
  const chosen = (club?.books ?? [])
    .filter((b) => b.proposed_by === userId && b.edition_number != null)
    .map((b) => b.edition_number!)
    .sort((a, b) => a - b)
  const since = member ? `${MONTH_NAMES[Number(member.joined_at.slice(5, 7)) - 1]} de ${member.joined_at.slice(0, 4)}` : null

  return (
    <ProfileView
      profile={person}
      back={{ to: clubPath(clubId), label: club?.name.toLowerCase() ?? 'clube' }}
      extra={
        club &&
        member && (
          <section aria-label="No clube" className="flex flex-col gap-1 rounded-card bg-petal p-4 text-center">
            <Eyebrow>no clube {club.name.toLowerCase()} desde</Eyebrow>
            <HandText className="text-ink">
              {since} · {member.role === 'owner' ? 'dona' : 'membro'}
              {chosen.length > 0 && ` · escolheu ${chosen.map((n) => formatEdition(n)).join(', ')}`}
            </HandText>
          </section>
        )
      }
    />
  )
}

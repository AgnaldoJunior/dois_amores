import { Link } from 'react-router'
import { Avatar } from '@/components/ui/Avatar'
import { ButtonLink } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Label, ScriptTitle, SectionTitle } from '@/components/ui/Typography'
import { useProfile } from '@/features/profile/api'

type Stat = { value: string; label: string }

function StatCard({ value, label }: Stat) {
  return (
    <Card className="flex-1 p-3 text-center flex flex-col gap-1">
      <span className="font-display text-5xl leading-none text-primary">{value}</span>
      <Label className="text-2xs tracking-normal">{label}</Label>
    </Card>
  )
}

export function HomePage() {
  const { data: profile } = useProfile()
  const firstName = profile?.name.split(/\s+/)[0] ?? ''

  // Dados reais chegam na Fase 4 (estatísticas calculadas a partir de user_books).
  const stats: Stat[] = [
    { value: '0', label: 'Livros lidos' },
    { value: '0', label: 'Páginas lidas' },
    { value: '0', label: 'Clubes' },
  ]

  return (
    <div className="flex flex-col gap-4">
      <Link to="/perfil" className="flex items-center gap-3 self-start" aria-label="Abrir meu perfil">
        <Avatar name={profile?.name ?? ''} url={profile?.avatar_url} size="md" />
        <ScriptTitle>{firstName ? `Olá, ${firstName}` : 'Olá!'}</ScriptTitle>
      </Link>

      <section aria-label="Suas estatísticas" className="flex gap-2">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </section>

      <ButtonLink to="/publicar" className="text-base">
        PUBLICAR NOVA LEITURA
      </ButtonLink>

      <SectionTitle>Leituras recentes</SectionTitle>
      <EmptyState>Suas leituras vão aparecer aqui.</EmptyState>
    </div>
  )
}

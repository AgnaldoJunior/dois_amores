import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import { Button } from '@/components/ui/Button'
import { FormMessage } from '@/components/ui/FormMessage'
import { TextField } from '@/components/ui/TextField'
import { Label, PageTitle } from '@/components/ui/Typography'
import { todayIso } from '@/lib/dates'
import { clubPath } from '@/features/clubs/ClubsPage'
import { useMagazineSource } from './api'
import { buildMagazineData, defaultPeriod, periodLabel, type Period } from './buildMagazineData'
import { inlineImages } from './inlineImages'
import { renderMagazine } from './render'
import { DEFAULT_TEMPLATE_ID, listTemplates } from './templates'

type Status = 'idle' | 'images' | 'pdf' | 'done' | 'error'

const STATUS_TEXT: Record<Status, string> = {
  idle: '',
  images: 'Buscando capas e fotos…',
  pdf: 'Montando a revista…',
  done: 'Revista pronta!',
  error: 'Não foi possível gerar a revista. Tente de novo.',
}

const fileName = (club: string) =>
  `revista-${club
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')}.pdf`

/** /clubes/:clubId/revista — escolher o template e exportar o PDF (Figma 13). */
export function MagazinePage() {
  const { clubId = '' } = useParams()
  const templates = useMemo(() => listTemplates(), [])
  const { data: source, isLoading, isError } = useMagazineSource(clubId)

  const [templateId, setTemplateId] = useState(templates[0]?.id ?? DEFAULT_TEMPLATE_ID)
  const [customPeriod, setCustomPeriod] = useState<Period | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)

  const thisMonth = todayIso().slice(0, 7)
  const period = customPeriod ?? (source && defaultPeriod(source)) ?? { from: thisMonth, to: thisMonth }
  const invalidPeriod = period.from > period.to

  useEffect(() => () => (pdfUrl ? URL.revokeObjectURL(pdfUrl) : undefined), [pdfUrl])

  async function onGenerate() {
    const template = templates.find((t) => t.id === templateId)
    if (!source || !template || invalidPeriod) return
    setPdfUrl(null)
    try {
      setStatus('images')
      const [data, loaded] = await Promise.all([inlineImages(buildMagazineData(source, period)), template.load()])
      setStatus('pdf')
      const blob = await renderMagazine(loaded, data)
      const url = URL.createObjectURL(blob)
      setPdfUrl(url)
      setStatus('done')
      const link = Object.assign(document.createElement('a'), { href: url, download: fileName(source.club.name) })
      link.click()
    } catch (err) {
      console.error(err)
      setStatus('error')
    }
  }

  if (isLoading) return <p className="font-hand text-lg text-primary">Reunindo as edições…</p>
  if (isError || !source) return <FormMessage tone="error">Clube não encontrado.</FormMessage>

  const busy = status === 'images' || status === 'pdf'
  const editions = source.clubBooks.filter((cb) => cb.status === 'finished').length

  return (
    <div className="flex flex-col gap-4">
      <PageTitle>Exportar revista</PageTitle>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 font-mono text-xs uppercase tracking-label text-primary">Template</legend>
        <div className="grid grid-cols-2 gap-3">
          {templates.map((t) => (
            <label
              key={t.id}
              className={
                'flex cursor-pointer flex-col gap-1 rounded-card border p-4 has-[:focus-visible]:outline has-[:focus-visible]:outline-primary ' +
                (t.id === templateId ? 'border-primary bg-card' : 'border-primary bg-transparent')
              }
            >
              <input
                type="radio"
                name="template"
                value={t.id}
                checked={t.id === templateId}
                onChange={() => setTemplateId(t.id)}
                className="sr-only"
              />
              <span className="font-script text-3xl leading-tight text-primary">{t.name}</span>
              <span className="font-sans text-sm text-primary">{t.description}</span>
              {t.id === templateId && <span className="font-hand text-lg text-primary">✓ selecionado</span>}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <TextField
          label="De"
          type="month"
          value={period.from}
          max={period.to}
          onChange={(e) => e.target.value && setCustomPeriod({ ...period, from: e.target.value })}
        />
        <TextField
          label="Até"
          type="month"
          value={period.to}
          min={period.from}
          onChange={(e) => e.target.value && setCustomPeriod({ ...period, to: e.target.value })}
        />
      </div>
      {invalidPeriod && <FormMessage tone="error">O início do período precisa ser antes do fim.</FormMessage>}
      <p className="font-sans text-sm text-primary">
        {editions === 0
          ? 'O clube ainda não tem edições concluídas: a revista terá a capa, o Book Track e as leituras de cada membro.'
          : `Período: ${periodLabel(period)}.`}
      </p>

      <Button onClick={onGenerate} loading={busy} disabled={invalidPeriod} className="text-base">
        GERAR PDF
      </Button>
      {status !== 'idle' && (
        <p role="status" className={`font-sans text-sm ${status === 'error' ? 'text-danger' : 'text-primary'}`}>
          {STATUS_TEXT[status]}
        </p>
      )}
      {pdfUrl && (
        <a href={pdfUrl} target="_blank" rel="noreferrer" className="self-start font-sans text-sm text-primary underline underline-offset-4">
          Abrir a revista (PDF)
        </a>
      )}

      <Label>Pré-visualização · página 1</Label>
      <CoverPreview clubName={source.club.name} period={periodLabel(period)} />

      <Link to={clubPath(clubId)} className="self-center font-sans text-sm text-primary underline underline-offset-4">
        Voltar para o clube
      </Link>
    </div>
  )
}

/** Prévia simplificada da capa (a página 1 do template "dois-amores"). */
function CoverPreview({ clubName, period }: { clubName: string; period: string }) {
  return (
    <div
      aria-hidden="true"
      className="flex aspect-video w-full items-center justify-center rounded-card border border-primary p-6"
      style={{
        backgroundImage:
          'repeating-linear-gradient(90deg, var(--da-color-stripe) 0 var(--da-size-stripe), var(--da-color-page) var(--da-size-stripe) calc(var(--da-size-stripe) * 2))',
      }}
    >
      <div className="flex flex-col items-center gap-1 rounded-sm bg-primary px-6 py-4 text-center">
        <span className="font-display text-4xl leading-none text-inverse">{clubName.toUpperCase()}</span>
        <span className="font-script text-2xl leading-tight text-accent">clube do livro</span>
        <span className="font-mono text-2xs uppercase tracking-label text-inverse">{period}</span>
      </div>
    </div>
  )
}

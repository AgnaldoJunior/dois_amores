import type { MagazineTemplate, TemplateMeta } from '@templates/revista/_shared/types'

/**
 * Templates da revista descobertos automaticamente: toda pasta em templates/revista/<id>/
 * com tokens.json + template.tsx aparece na lista. Nada a registrar à mão.
 * O tokens.json (pequeno) é lido na hora; o template.tsx (com o @react-pdf) só é
 * carregado quando alguém exporta.
 */
const metas = import.meta.glob<TemplateMeta>('/templates/revista/*/tokens.json', { eager: true, import: 'default' })
const loaders = import.meta.glob<{ default: MagazineTemplate }>('/templates/revista/*/template.tsx')

export type TemplateEntry = {
  id: string
  name: string
  description: string
  load: () => Promise<MagazineTemplate>
}

export const DEFAULT_TEMPLATE_ID = 'dois-amores'

export function listTemplates(
  metaFiles: Record<string, TemplateMeta> = metas,
  loaderFiles: Record<string, () => Promise<{ default: MagazineTemplate }>> = loaders,
): TemplateEntry[] {
  return Object.entries(metaFiles)
    .flatMap(([path, tokens]) => {
      const id = path.split('/').at(-2) ?? ''
      const loader = loaderFiles[path.replace(/tokens\.json$/, 'template.tsx')]
      if (!loader || !tokens?.meta?.name) return []
      return [{ id, name: tokens.meta.name, description: tokens.meta.description, load: () => loader().then((m) => m.default) }]
    })
    .sort((a, b) => (a.id === DEFAULT_TEMPLATE_ID ? -1 : b.id === DEFAULT_TEMPLATE_ID ? 1 : a.name.localeCompare(b.name)))
}

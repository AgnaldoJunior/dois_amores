const MONTHS_SHORT = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ']

/** "2026-10-12" → { year: 2026, month: 10, day: 12 } sem passar por fuso horário. */
export function parseIsoDate(iso: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  if (!match) return null
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) }
}

/** "2026-10-12" → "12 OUT 2026" (estilo dos cartões do Figma). */
export function formatDateShort(iso: string | null | undefined): string {
  const d = iso ? parseIsoDate(iso) : null
  if (!d) return ''
  return `${String(d.day).padStart(2, '0')} ${MONTHS_SHORT[d.month - 1]} ${d.year}`
}

/** Data local de hoje no formato do <input type="date">. */
export function todayIso(now = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

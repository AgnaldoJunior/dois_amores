const DAY = 24 * 3600 * 1000
const days = (from: string, to: string) => Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY)

/**
 * Prazo da leitura da vez: "dia 12 de 20" e quantos dias faltam.
 * Sem início ou sem prazo → null.
 */
export function dueProgress(startedOn: string | null, dueOn: string | null, today: string) {
  if (!startedOn || !dueOn) return null
  const total = Math.max(1, days(startedOn, dueOn) + 1)
  const day = Math.max(1, Math.min(total, days(startedOn, today) + 1))
  return { day, total, left: days(today, dueOn) }
}

/** Bichinhos do perfil: marcam os livros que cada pessoa escolheu no clube. */
export const PETS = [
  { emoji: '🐵', label: 'macaquinho' },
  { emoji: '🐭', label: 'ratinho' },
  { emoji: '🐈‍⬛', label: 'gato preto' },
  { emoji: '🦒', label: 'girafa' },
  { emoji: '🐰', label: 'coelhinho' },
  { emoji: '🦊', label: 'raposa' },
  { emoji: '🐸', label: 'sapinho' },
  { emoji: '🐻', label: 'ursinho' },
] as const

export const petLabel = (emoji: string | null | undefined) => PETS.find((p) => p.emoji === emoji)?.label

/** "Irla 🐭" (o emoji é decorativo para leitores de tela). */
export const withPet = (name: string, pet: string | null | undefined) => (pet ? `${name} ${pet}` : name)

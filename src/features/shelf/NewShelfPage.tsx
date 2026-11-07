import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { BackLink } from '@/components/ui/BackLink'
import { Button } from '@/components/ui/Button'
import { FormMessage } from '@/components/ui/FormMessage'
import { TextField } from '@/components/ui/TextField'
import { HandText, PageTitle } from '@/components/ui/Typography'
import { shelfColors } from '@/theme/tokens'
import { SHELF_COLORS, useCreateShelf, type ShelfColor } from './shelvesApi'

/** /estantes/nova — "crie uma estante" do seu jeito ("pra reler", "pra chorar"…). */
export function NewShelfPage() {
  const navigate = useNavigate()
  const create = useCreateShelf()
  const [name, setName] = useState('')
  const [color, setColor] = useState<ShelfColor>('vinho')
  const [error, setError] = useState('')

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return setError('Dê um nome para a estante.')
    setError('')
    try {
      const id = await create.mutateAsync({ name, color })
      navigate(`/estantes/${id}`, { replace: true })
    } catch (err) {
      setError((err as { code?: string }).code === '23505' ? 'Você já tem uma estante com esse nome.' : 'Não foi possível criar. Tente de novo.')
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      <BackLink to="/estantes">estantes</BackLink>
      <div>
        <PageTitle>crie uma estante</PageTitle>
        <HandText>pra organizar do seu jeito: “favoritos de {new Date().getFullYear()}”, “pra chorar”, o que quiser.</HandText>
      </div>
      <TextField label="Nome da estante" maxLength={40} placeholder="ex.: pra reler" value={name} onChange={(e) => setName(e.target.value)} />
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 font-sans text-2xs font-semibold uppercase tracking-label text-primary">Cor</legend>
        <div className="flex gap-3">
          {SHELF_COLORS.map((c) => (
            <label
              key={c}
              className={'flex size-11 cursor-pointer items-center justify-center rounded-full border-strong has-[:focus-visible]:outline has-[:focus-visible]:outline-primary ' + (color === c ? 'border-primary' : 'border-transparent')}
            >
              <input type="radio" name="color" value={c} checked={color === c} onChange={() => setColor(c)} className="sr-only" aria-label={c} />
              <span aria-hidden="true" className="size-swatch rounded-full" style={{ backgroundColor: shelfColors[c].bg }} />
            </label>
          ))}
        </div>
      </fieldset>
      {error && <FormMessage tone="error">{error}</FormMessage>}
      <Button type="submit" loading={create.isPending}>
        criar estante
      </Button>
    </form>
  )
}

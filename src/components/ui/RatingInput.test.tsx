import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { RatingInput } from './RatingInput'

function Harness({ onChange }: { onChange: (v: number | null) => void }) {
  const [value, setValue] = useState<number | null>(null)
  return (
    <RatingInput
      label="Plot"
      value={value}
      onChange={(v) => {
        setValue(v)
        onChange(v)
      }}
    />
  )
}

describe('<RatingInput>', () => {
  it('é um grupo acessível com 5 opções', () => {
    render(<Harness onChange={() => {}} />)
    expect(screen.getByRole('group', { name: 'Plot' })).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(5)
  })

  it('marca a nota ao clicar e limpa ao clicar de novo', async () => {
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)
    await userEvent.click(screen.getByRole('radio', { name: '4 estrelas' }))
    expect(onChange).toHaveBeenLastCalledWith(4)
    expect(screen.getByRole('radio', { name: '4 estrelas' })).toBeChecked()
    await userEvent.click(screen.getByRole('radio', { name: '4 estrelas' }))
    expect(onChange).toHaveBeenLastCalledWith(null)
  })

  it('funciona pelo teclado', async () => {
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)
    await userEvent.click(screen.getByRole('radio', { name: '2 estrelas' }))
    await userEvent.keyboard('{ArrowRight}')
    expect(onChange).toHaveBeenLastCalledWith(3)
  })
})

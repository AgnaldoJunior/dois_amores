// @vitest-environment node
import { join } from 'node:path'
import { Font, renderToBuffer } from '@react-pdf/renderer'
import { buildMagazineData, defaultPeriod } from '@/features/magazine/buildMagazineData'
import { registerFonts } from '@/features/magazine/render'
import { sampleSource } from '@/features/magazine/sampleSource'
import type { MagazineData } from '../_shared/types'
import template, { chunk, outsidePanels } from './template'
import tokens from './tokens.json'

/** Conta páginas no PDF gerado. */
const pageCount = (pdf: Buffer) => (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) ?? []).length

const render = (data: MagazineData) => renderToBuffer(<template.Document data={data} />)

beforeAll(() => {
  registerFonts(Font, template.fonts, (path) => join(process.cwd(), 'public', path))
})

describe('template "dois-amores" — geração do PDF', () => {
  const data = buildMagazineData(sampleSource, defaultPeriod(sampleSource)!)

  it('gera um PDF com capa, Book Track, um Book Review por livro e "fora do clube"', async () => {
    const pdf = await render(data)
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-')
    // capa + track + 6 edições (4 membros → 1 página cada) + 4 membros / 2 por página
    const minimum = 1 + 1 + 6 + 2
    expect(pageCount(pdf)).toBeGreaterThanOrEqual(minimum)
    expect(pageCount(pdf)).toBeLessThanOrEqual(minimum + 6) // + no máximo uma continuação por edição
  }, 60_000)

  it('texto que não cabe nem em 8 pt continua numa página extra', async () => {
    const huge = 'Comentário enorme que não cabe na caixa. '.repeat(60)
    const base = await render({ ...data, editions: data.editions.slice(0, 1) })
    const long = {
      ...data,
      editions: [
        { ...data.editions[0]!, reviews: data.editions[0]!.reviews.map((r, i) => (i === 0 ? { ...r, comment: huge } : r)) },
      ],
    }
    expect(pageCount(await render(long))).toBe(pageCount(base) + 1)
  }, 60_000)

  it('mais de 4 membros: a revisão do livro continua em outra página', async () => {
    const six = data.editions[0]!.reviews.concat(data.editions[0]!.reviews.slice(0, 2).map((r) => ({ ...r, memberId: `${r.memberId}-2` })))
    const one = { ...data, editions: [{ ...data.editions[0]!, reviews: data.editions[0]!.reviews }] }
    const many = { ...data, editions: [{ ...data.editions[0]!, reviews: six }] }
    expect(pageCount(await render(many))).toBe(pageCount(await render(one)) + 1)
  }, 60_000)

  it('clube sem edições ainda gera capa, Book Track vazio e prateleiras', async () => {
    const pdf = await render({ ...data, editions: [], track: [] })
    expect(pageCount(pdf)).toBe(1 + 1 + 2)
  }, 60_000)
})

describe('template "dois-amores" — regras de layout', () => {
  it('Book Track: 10 colunas × 3 linhas por página', () => {
    expect(tokens.bookTrack.columns * tokens.bookTrack.rows).toBe(30)
    expect(chunk(Array.from({ length: 31 }), 30).map((p) => p.length)).toEqual([30, 1])
  })

  it('prateleira grande de um membro vira mais de um painel', () => {
    const shelf = { member: { id: 'm', name: 'Irla', avatar: null }, books: Array.from({ length: 30 }, () => ({ book: { title: 'x', author: null, pages: null, cover: null }, average: 4 })) }
    const panels = outsidePanels([shelf], 24)
    expect(panels.map((p) => [p.books.length, p.part, p.parts])).toEqual([
      [24, 1, 2],
      [6, 2, 2],
    ])
  })
})

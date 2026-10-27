import { buildMagazineData, defaultPeriod, periodLabel } from './buildMagazineData'
import { sampleSource } from './sampleSource'

describe('dados da revista (clube Dois Amores, maio a outubro de 2026)', () => {
  const period = defaultPeriod(sampleSource)!
  const data = buildMagazineData(sampleSource, period)

  it('período padrão: da primeira à última edição concluída', () => {
    expect(period).toEqual({ from: '2026-05', to: '2026-10' })
    expect(data.periodLabel).toBe('maio a outubro de 2026')
  })

  it('formata períodos de um mês e entre anos', () => {
    expect(periodLabel({ from: '2026-05', to: '2026-05' })).toBe('maio de 2026')
    expect(periodLabel({ from: '2026-12', to: '2027-02' })).toBe('dezembro de 2026 a fevereiro de 2027')
  })

  it('6 edições na ordem, com mês e número do carimbo', () => {
    expect(data.editions.map((e) => [e.number, e.month, e.year, e.book.title])).toEqual([
      [1, 'MAIO', 2026, 'Tudo é rio'],
      [2, 'JUNHO', 2026, 'A cabeça do santo'],
      [3, 'JULHO', 2026, 'Eu que nunca conheci os homens'],
      [4, 'AGOSTO', 2026, 'O massacre da família Hope'],
      [5, 'SETEMBRO', 2026, 'Três'],
      [6, 'OUTUBRO', 2026, 'Amanhecer na colheita'],
    ])
  })

  it('uma coluna por membro, na ordem de entrada no clube', () => {
    expect(data.editions[0]!.reviews.map((r) => r.memberName)).toEqual(['Leyna', 'Irla', 'Wanessa', 'Thaís'])
  })

  it('média geral do livro = média das médias dos membros', () => {
    // Três: Leyna 4,5 · Irla 4,75 · Wanessa 3,75 · Thaís 4,75 → 17,75 / 4
    const tres = data.editions[4]!
    expect(tres.reviews.map((r) => r.average)).toEqual([4.5, 4.75, 3.75, 4.75])
    expect(tres.average).toBeCloseTo(4.4375)
  })

  it('quem não terminou fica com a coluna vazia e não entra na média', () => {
    const homens = data.editions[2]!
    const thais = homens.reviews[3]!
    expect(thais.average).toBeNull()
    expect(thais.finishedOn).toBeNull()
    expect(homens.average).toBeCloseTo((4.75 + 4.75 + 3.75) / 3)
  })

  it('Book Track: edições concluídas (propostas pendentes ficam de fora)', () => {
    expect(data.track).toHaveLength(6)
    expect(data.track.map((t) => t.book.title)).not.toContain('Torto arado')
  })

  it('"Enquanto isso, fora do clube": livros terminados no período que não são do clube', () => {
    const byName = Object.fromEntries(data.outside.map((o) => [o.member.name, o.books.map((b) => b.book.title)]))
    expect(byName.Leyna).toEqual(['A biblioteca da meia-noite', 'Água fresca para as flores'])
    expect(byName.Irla).toEqual(['O avesso da pele', 'O conto da aia', 'Quarta asa'])
    expect(byName.Wanessa).toEqual(['Verity', 'Quarta asa'])
    expect(byName['Thaís']).toEqual(['A hora da estrela', 'O conto da aia'])
  })

  it('período menor filtra edições e leituras de fora', () => {
    const summer = buildMagazineData(sampleSource, { from: '2026-06', to: '2026-07' })
    expect(summer.editions.map((e) => e.number)).toEqual([2, 3])
    expect(summer.outside.find((o) => o.member.name === 'Irla')!.books.map((b) => b.book.title)).toEqual([
      'O conto da aia',
    ])
  })
})

import { ARCHETYPES, archetypeLabel, QUESTIONS, scoreQuiz } from './archetypes'

describe('teste de leitora', () => {
  it('tem 15 perguntas de 4 opções e 8 arquétipos completos', () => {
    expect(QUESTIONS).toHaveLength(15)
    for (const q of QUESTIONS) expect(q.options).toHaveLength(4)
    expect(Object.keys(ARCHETYPES)).toHaveLength(8)
    for (const a of Object.values(ARCHETYPES)) expect(a.books).toHaveLength(3)
  })

  it('cada arquétipo pode ser alcançado por alguma resposta', () => {
    const reachable = new Set(QUESTIONS.flatMap((q) => q.options.flatMap((o) => Object.keys(o.scores))))
    expect([...reachable].sort()).toEqual(Object.keys(ARCHETYPES).sort())
  })

  it('só a letra B leva à detetive', () => {
    const r = scoreQuiz(Array(15).fill(1))
    expect(r.primary.id).toBe('detetive')
    expect(r.dna[0]).toEqual({ archetype: ARCHETYPES.detetive, percent: 100 })
    expect(r.dna).toHaveLength(4)
    expect(r.dna[1]!.percent).toBeLessThan(100)
  })

  it('madrugadas e imersão levam à coruja', () => {
    // C, C, C, … tende ao viajante; trocando as respostas da madrugada, vira coruja.
    const answers = [2, 2, 2, 2, 1, 0, 1, 1, 1, 0, 1, 2, 0, 2, 2]
    const r = scoreQuiz(answers)
    expect(r.primary.id).toBe('coruja')
    expect(r.secondary.id).not.toBe('coruja')
  })

  it('nome do arquétipo para o perfil', () => {
    expect(archetypeLabel('coruja')).toBe('a coruja da madrugada')
    expect(archetypeLabel('outro')).toBe('outro')
  })
})

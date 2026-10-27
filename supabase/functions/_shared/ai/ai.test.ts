import { buildGeminiBody, GeminiProvider, toGeminiSchema } from './gemini.ts'
import { createAiProvider } from './index.ts'
import { parseSummaryTranslation, translateSummaryRequest } from './prompts.ts'
import { AiProviderError } from './provider.ts'

const geminiReply = (payload: unknown) =>
  new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(payload) }] } }] }))

describe('provedor de IA', () => {
  it('modelos vêm do ambiente, com reserva', async () => {
    const fetchFn = vi.fn().mockResolvedValue(geminiReply({ ok: true }))
    vi.stubGlobal('fetch', fetchFn)
    const env = (vars: Record<string, string>) => ({ get: (k: string) => vars[k] })
    await createAiProvider(env({ GEMINI_API_KEY: 'k', GEMINI_MODEL: 'gemini-x' })).generateJson({ prompt: 'a', schema: { type: 'string' } })
    expect(fetchFn.mock.calls[0]![0]).toContain('/models/gemini-x:generateContent')
    vi.unstubAllGlobals()
  })

  it('escolhe o Gemini por padrão e recusa provedor desconhecido', () => {
    const env = (vars: Record<string, string>) => ({ get: (k: string) => vars[k] })
    expect(createAiProvider(env({ GEMINI_API_KEY: 'k' })).name).toBe('gemini')
    expect(() => createAiProvider(env({ AI_PROVIDER: 'outro', GEMINI_API_KEY: 'k' }))).toThrow(/desconhecido/)
    expect(() => createAiProvider(env({}))).toThrow(AiProviderError)
  })

  it('converte o schema para o formato do Gemini', () => {
    expect(
      toGeminiSchema({
        type: 'object',
        properties: { lista: { type: 'array', items: { type: 'string' }, maxItems: 3 } },
        required: ['lista'],
      }),
    ).toEqual({
      type: 'OBJECT',
      properties: { lista: { type: 'ARRAY', items: { type: 'STRING' }, maxItems: 3 } },
      required: ['lista'],
    })
  })

  it('só envia thinkingBudget para modelos 2.x (os 3.x recusam)', () => {
    const req = { prompt: 'x', schema: { type: 'string' } as const }
    expect(buildGeminiBody('gemini-2.5-flash', req).generationConfig).toHaveProperty('thinkingConfig')
    expect(buildGeminiBody('gemini-3.5-flash-lite', req).generationConfig).not.toHaveProperty('thinkingConfig')
  })

  it('com o principal sobrecarregado, tenta de novo e passa para o reserva', async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(new Response('', { status: 503 }))
      .mockResolvedValueOnce(new Response('', { status: 503 }))
      .mockResolvedValueOnce(geminiReply({ ok: 'reserva' }))
    const sleep = vi.fn().mockResolvedValue(undefined)
    const ai = new GeminiProvider({ apiKey: 'k', models: ['principal', 'reserva'], fetchFn, sleep })
    await expect(ai.generateJson({ prompt: 'x', schema: { type: 'string' } })).resolves.toEqual({ ok: 'reserva' })
    expect(fetchFn.mock.calls.map((c) => String(c[0]).match(/models\/([^:]+)/)![1])).toEqual(['principal', 'principal', 'reserva'])
    expect(sleep).toHaveBeenCalledTimes(1)
  })

  it('modelo indisponível (404) vai direto para o reserva; erro de pedido (400) não repete', async () => {
    const fetchFn = vi.fn().mockResolvedValueOnce(new Response('', { status: 404 })).mockResolvedValueOnce(geminiReply({ ok: 1 }))
    const ai = new GeminiProvider({ apiKey: 'k', models: ['velho', 'novo'], fetchFn, sleep: async () => {} })
    await expect(ai.generateJson({ prompt: 'x', schema: { type: 'string' } })).resolves.toEqual({ ok: 1 })
    expect(fetchFn).toHaveBeenCalledTimes(2)

    const bad = vi.fn().mockResolvedValue(new Response('', { status: 400 }))
    const ai2 = new GeminiProvider({ apiKey: 'k', models: ['a', 'b'], fetchFn: bad, sleep: async () => {} })
    await expect(ai2.generateJson({ prompt: 'x', schema: { type: 'string' } })).rejects.toMatchObject({ status: 400 })
    expect(bad).toHaveBeenCalledTimes(1)
  })

  it('modelo que demora demais conta como indisponível e passa para o reserva', async () => {
    const timeout = Object.assign(new Error('timeout'), { name: 'TimeoutError' })
    const fetchFn = vi.fn().mockRejectedValueOnce(timeout).mockResolvedValueOnce(geminiReply({ ok: 'rapido' }))
    const ai = new GeminiProvider({ apiKey: 'k', models: ['lento', 'rapido'], retries: 0, fetchFn, sleep: async () => {} })
    await expect(ai.generateJson({ prompt: 'x', schema: { type: 'string' } })).resolves.toEqual({ ok: 'rapido' })
    expect((fetchFn.mock.calls[0]![1] as RequestInit).signal).toBeInstanceOf(AbortSignal)
  })

  it('padrão: modelos lite (rápidos) com reserva', () => {
    const fetchFn = vi.fn().mockResolvedValue(geminiReply({}))
    vi.stubGlobal('fetch', fetchFn)
    const ai = createAiProvider({ get: (k: string) => (k === 'GEMINI_API_KEY' ? 'k' : undefined) })
    return ai.generateJson({ prompt: 'x', schema: { type: 'string' } }).then(() => {
      expect(fetchFn.mock.calls[0]![0]).toContain('/models/gemini-3.5-flash-lite:')
      vi.unstubAllGlobals()
    })
  })

  it('chama o modelo com a chave no cabeçalho e devolve o JSON', async () => {
    const fetchFn = vi.fn().mockResolvedValue(geminiReply({ ok: true }))
    const ai = new GeminiProvider({ apiKey: 'segredo', models: ['gemini-3.8-flash'], fetchFn })
    const result = await ai.generateJson({ prompt: 'oi', schema: { type: 'object', properties: {} } })
    expect(result).toEqual({ ok: true })
    const [url, init] = fetchMock(fetchFn)
    expect(url).toContain('/models/gemini-3.8-flash:generateContent')
    expect(url).not.toContain('segredo')
    expect(init.headers['x-goog-api-key']).toBe('segredo')
    expect(JSON.parse(init.body).generationConfig.responseMimeType).toBe('application/json')
  })

  it('erros HTTP e respostas inválidas viram AiProviderError', async () => {
    const failing = new GeminiProvider({
      apiKey: 'k',
      models: ['so-um'],
      fetchFn: vi.fn().mockResolvedValue(new Response('', { status: 429 })),
      sleep: async () => {},
    })
    await expect(failing.generateJson({ prompt: 'x', schema: { type: 'string' } })).rejects.toMatchObject({ status: 429 })
    const broken = new GeminiProvider({
      apiKey: 'k',
      models: ['so-um'],
      sleep: async () => {},
      fetchFn: vi.fn(async () => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: 'não é json' }] } }] }))),
    })
    await expect(broken.generateJson({ prompt: 'x', schema: { type: 'string' } })).rejects.toThrow(AiProviderError)
  })
})

describe('tradução de resumo', () => {
  it('o pedido leva título, autor e o resumo delimitado', () => {
    const req = translateSummaryRequest({ title: 'Trois', author: 'Valérie Perrin', summary: 'Trois amis.' })
    expect(req.prompt).toContain('Trois — Valérie Perrin')
    expect(req.prompt).toContain('<sinopse>\nTrois amis.\n</sinopse>')
    expect(req.system).toMatch(/português do Brasil/)
  })

  it('valida a resposta', () => {
    expect(parseSummaryTranslation({ source_language: 'EN', translation: ' Três amigos. ' })).toEqual({
      sourceLanguage: 'en',
      translation: 'Três amigos.',
    })
    expect(() => parseSummaryTranslation({ source_language: 'english', translation: 'x' })).toThrow()
    expect(() => parseSummaryTranslation({ source_language: 'en', translation: '' })).toThrow()
    expect(() => parseSummaryTranslation(null)).toThrow()
  })
})

function fetchMock(fn: ReturnType<typeof vi.fn>) {
  const [url, init] = fn.mock.calls[0] as [string, { headers: Record<string, string>; body: string }]
  return [url, init] as const
}

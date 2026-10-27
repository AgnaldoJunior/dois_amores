import { AiProviderError, type AiProvider, type JsonRequest, type JsonSchema } from './provider.ts'

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models'

/** Status em que vale tentar de novo / passar para o modelo reserva. */
const RETRYABLE = new Set([429, 500, 503, 504])

type GeminiOptions = {
  apiKey: string
  /** Modelo principal seguido dos reservas, em ordem. */
  models?: string[]
  /** Tentativas extras por modelo antes de passar ao próximo. */
  retries?: number
  /** Tempo máximo de cada tentativa; estourou, conta como indisponível e tenta o próximo. */
  timeoutMs?: number
  fetchFn?: typeof fetch
  sleep?: (ms: number) => Promise<void>
}

/**
 * Padrão medido em out/2026 com a chave do projeto: o gemini-2.5-flash não está mais
 * disponível para contas novas e o gemini-3.8-flash levou 70–90 s por resposta
 * (alta demanda). Os "lite" respondem em ~1 s. Troque por GEMINI_MODEL sem mexer no código.
 */
export const DEFAULT_GEMINI_MODELS = ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite']

/** Converte o JSON Schema simplificado para o formato OpenAPI do Gemini (tipos em maiúsculas). */
export function toGeminiSchema(schema: JsonSchema): Record<string, unknown> {
  const base: Record<string, unknown> = { type: schema.type.toUpperCase() }
  if (schema.description) base.description = schema.description
  switch (schema.type) {
    case 'string':
      if (schema.enum) base.enum = schema.enum
      return base
    case 'array':
      return {
        ...base,
        items: toGeminiSchema(schema.items),
        ...(schema.minItems != null && { minItems: schema.minItems }),
        ...(schema.maxItems != null && { maxItems: schema.maxItems }),
      }
    case 'object':
      return {
        ...base,
        properties: Object.fromEntries(Object.entries(schema.properties).map(([k, v]) => [k, toGeminiSchema(v)])),
        ...(schema.required && { required: schema.required }),
      }
    default:
      return base
  }
}

/**
 * Corpo da requisição. O ajuste `thinkingBudget` só existe nos modelos 2.x
 * (os 3.x recusam o parâmetro), então só é enviado para eles.
 */
export function buildGeminiBody(model: string, { system, prompt, schema, temperature = 0.4 }: JsonRequest) {
  return {
    ...(system && { systemInstruction: { parts: [{ text: system }] } }),
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature,
      responseMimeType: 'application/json',
      responseSchema: toGeminiSchema(schema),
      ...(model.startsWith('gemini-2') && { thinkingConfig: { thinkingBudget: 0 } }),
    },
  }
}

type GeminiResponse = {
  candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[]
  promptFeedback?: { blockReason?: string }
}

export class GeminiProvider implements AiProvider {
  readonly name = 'gemini'
  private readonly apiKey: string
  private readonly models: string[]
  private readonly retries: number
  private readonly timeoutMs: number
  private readonly fetchFn: typeof fetch
  private readonly sleep: (ms: number) => Promise<void>

  constructor({
    apiKey,
    models = DEFAULT_GEMINI_MODELS,
    retries = 1,
    timeoutMs = 25_000,
    fetchFn = fetch,
    sleep = (ms) => new Promise((r) => setTimeout(r, ms)),
  }: GeminiOptions) {
    if (!apiKey) throw new AiProviderError('GEMINI_API_KEY não configurada')
    if (models.length === 0) throw new AiProviderError('Nenhum modelo Gemini configurado')
    this.apiKey = apiKey
    this.models = models
    this.retries = retries
    this.timeoutMs = timeoutMs
    this.fetchFn = fetchFn
    this.sleep = sleep
  }

  async generateJson<T>(request: JsonRequest): Promise<T> {
    let lastError: AiProviderError | undefined
    for (const model of this.models) {
      for (let attempt = 0; attempt <= this.retries; attempt++) {
        if (attempt > 0) await this.sleep(800 * attempt)
        try {
          return await this.call<T>(model, request)
        } catch (err) {
          if (!(err instanceof AiProviderError)) throw err
          lastError = err
          // 404 (modelo indisponível) pula direto para o reserva; erros de pedido não adiantam repetir.
          if (err.status === 404) break
          if (err.status != null && !RETRYABLE.has(err.status)) throw err
        }
      }
    }
    throw lastError ?? new AiProviderError('Gemini indisponível')
  }

  private async call<T>(model: string, request: JsonRequest): Promise<T> {
    let res: Response
    try {
      res = await this.fetchFn(`${ENDPOINT}/${model}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': this.apiKey },
        body: JSON.stringify(buildGeminiBody(model, request)),
        signal: AbortSignal.timeout(this.timeoutMs),
      })
    } catch (err) {
      const name = (err as { name?: string }).name
      if (name === 'TimeoutError' || name === 'AbortError') {
        throw new AiProviderError(`Gemini (${model}) demorou mais de ${this.timeoutMs} ms`, 504)
      }
      throw new AiProviderError(`Falha de rede ao chamar o Gemini (${model})`, 503)
    }

    if (!res.ok) throw new AiProviderError(`Gemini (${model}) respondeu ${res.status}`, res.status)

    const json = (await res.json()) as GeminiResponse
    if (json.promptFeedback?.blockReason) {
      throw new AiProviderError(`Pedido bloqueado pelo Gemini (${json.promptFeedback.blockReason})`, 400)
    }
    const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? ''
    if (!text) throw new AiProviderError(`Resposta vazia do Gemini (${model})`, 503)

    try {
      return JSON.parse(text) as T
    } catch {
      throw new AiProviderError(`Resposta do Gemini (${model}) não é JSON válido`, 503)
    }
  }
}

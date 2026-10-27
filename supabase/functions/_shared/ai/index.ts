import { DEFAULT_GEMINI_MODELS, GeminiProvider } from './gemini.ts'
import { AiProviderError, type AiProvider } from './provider.ts'

export type { AiProvider } from './provider.ts'

type Env = { get(name: string): string | undefined }

const list = (value: string | undefined) =>
  (value ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

/**
 * Escolhe o provedor pela variável AI_PROVIDER (padrão: gemini).
 * GEMINI_MODEL define o modelo principal e GEMINI_FALLBACK_MODELS os reservas
 * (separados por vírgula), usados quando o principal está indisponível.
 * Para adicionar outro provedor: crie o adaptador implementando AiProvider e inclua um case aqui.
 */
export function createAiProvider(env: Env): AiProvider {
  const provider = (env.get('AI_PROVIDER') ?? 'gemini').toLowerCase()
  switch (provider) {
    case 'gemini': {
      const primary = env.get('GEMINI_MODEL')?.trim() || DEFAULT_GEMINI_MODELS[0]!
      const fallbacks = env.get('GEMINI_FALLBACK_MODELS') != null
        ? list(env.get('GEMINI_FALLBACK_MODELS'))
        : DEFAULT_GEMINI_MODELS.slice(1)
      return new GeminiProvider({
        apiKey: env.get('GEMINI_API_KEY') ?? '',
        models: [primary, ...fallbacks.filter((m) => m !== primary)],
      })
    }
    default:
      throw new AiProviderError(`Provedor de IA desconhecido: ${provider}`)
  }
}

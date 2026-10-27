/**
 * Interface do provedor de IA. As Edge Functions só conhecem esta interface;
 * para trocar o Gemini por outro modelo, crie outro adaptador e registre-o em
 * createAiProvider (./index.ts).
 */

/** Subconjunto de JSON Schema suficiente para respostas estruturadas. */
export type JsonSchema =
  | { type: 'string'; description?: string; enum?: string[] }
  | { type: 'integer' | 'number' | 'boolean'; description?: string }
  | { type: 'array'; items: JsonSchema; description?: string; minItems?: number; maxItems?: number }
  | { type: 'object'; properties: Record<string, JsonSchema>; required?: string[]; description?: string }

export type JsonRequest = {
  /** Instruções fixas (papel, regras). */
  system?: string
  prompt: string
  schema: JsonSchema
  temperature?: number
}

export interface AiProvider {
  readonly name: string
  /** Gera uma resposta JSON que segue `schema` (ainda assim valide o resultado). */
  generateJson<T>(request: JsonRequest): Promise<T>
}

export class AiProviderError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message)
    this.name = 'AiProviderError'
  }
}

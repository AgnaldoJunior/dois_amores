// Edge Function "books": completa livros da Open Library com a edição em
// português da Google Books (sinopse da editora, capa e páginas) e guarda a capa
// no bucket "covers". A chave GOOGLE_BOOKS_API_KEY fica só no servidor.
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.118.0'
import { createAdminClient, getRequestUser, publicSupabaseUrl } from '../_shared/auth.ts'
import { coverSources, plannedChanges, type BookRow } from '../_shared/enrichment.ts'
import { searchPortugueseEdition, type Enrichment } from '../_shared/googleBooks.ts'
import { corsHeaders, errorResponse, json } from '../_shared/http.ts'

const BOOK_FIELDS = 'id, title, author, pages, cover_url, summary, summary_source, summary_lang, enriched_at'
const MIN_COVER_BYTES = 2_000 // a Open Library devolve um GIF de 1×1 quando não tem capa

/** Baixa a primeira capa válida da lista e grava em covers/<id>.jpg. Devolve a URL pública. */
async function storeCover(admin: SupabaseClient, bookId: string, sources: string[]): Promise<string | null> {
  for (const source of sources) {
    try {
      const res = await fetch(source, { signal: AbortSignal.timeout(10_000) })
      if (!res.ok || !(res.headers.get('content-type') ?? '').startsWith('image/jpeg')) continue
      const bytes = new Uint8Array(await res.arrayBuffer())
      if (bytes.byteLength < MIN_COVER_BYTES) continue
      const path = `${bookId}.jpg`
      const { error } = await admin.storage
        .from('covers')
        .upload(path, bytes, { contentType: 'image/jpeg', upsert: true, cacheControl: '31536000' })
      if (error) throw error
      return `${publicSupabaseUrl()}/storage/v1/object/public/covers/${path}`
    } catch (err) {
      console.error('[books] capa', source, err)
    }
  }
  return null
}

async function enrich(admin: SupabaseClient, bookId: string) {
  const { data: book, error } = await admin.from('books').select(BOOK_FIELDS).eq('id', bookId).maybeSingle<BookRow>()
  if (error) throw error
  if (!book) return errorResponse('not_found', 'Livro não encontrado', 404)
  if (book.enriched_at) return json(book)

  const apiKey = Deno.env.get('GOOGLE_BOOKS_API_KEY')
  let enrichment: Enrichment | null = null
  let googleAnswered = !apiKey
  if (apiKey) {
    try {
      enrichment = await searchPortugueseEdition(book, apiKey)
      googleAnswered = true
    } catch (err) {
      console.error('[books] Google Books', err)
    }
  }

  const changes = plannedChanges(book, enrichment)
  // Capa: edição em português da Google; se não houver, copia a da Open Library
  // (assim toda capa sai do nosso Storage, com CORS para o PDF da revista).
  const stored = await storeCover(admin, book.id, coverSources(book, enrichment))
  if (stored) changes.cover_url = stored
  // Google fora do ar: não marca como concluído, para tentar de novo na próxima visita.
  if (googleAnswered) changes.enriched_at = new Date().toISOString()

  if (Object.keys(changes).length === 0) return json(book)
  const { data: updated, error: updateError } = await admin
    .from('books')
    .update(changes)
    .eq('id', book.id)
    .select(BOOK_FIELDS)
    .single()
  if (updateError) throw updateError
  return json(updated)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return errorResponse('method_not_allowed', 'Use POST', 405)

  const user = await getRequestUser(req)
  if (!user) return errorResponse('unauthorized', 'Entre na sua conta', 401)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return errorResponse('bad_request', 'JSON inválido', 400)
  }
  if (body.action !== 'enrich' || typeof body.bookId !== 'string') {
    return errorResponse('bad_request', 'Use { action: "enrich", bookId }', 400)
  }

  try {
    return await enrich(createAdminClient(), body.bookId)
  } catch (err) {
    console.error('[books]', err)
    return errorResponse('internal', 'Não foi possível completar o livro agora', 500)
  }
})

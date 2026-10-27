/**
 * Contrato dos templates da revista.
 *
 * Cada template fica em templates/revista/<id>/ com:
 *   - tokens.json  → { "meta": { "name", "description" }, ...valores visuais do template }
 *   - template.tsx → export default { fonts, Document } (ver MagazineTemplate)
 * O app descobre as pastas sozinho (import.meta.glob); não é preciso registrar nada.
 */
import type { ReactElement } from 'react'

export type Ranks = {
  characters: number | null
  plot: number | null
  writing: number | null
  ending: number | null
}

export type MagazineMember = {
  id: string
  name: string
  /** data: URL já baixada (ou null → placeholder com a inicial). */
  avatar: string | null
}

export type MemberReview = {
  memberId: string
  memberName: string
  /** null = o membro não registrou a leitura deste livro. */
  startedOn: string | null
  finishedOn: string | null
  ranks: Ranks
  /** Média das 4 notas do membro (null sem notas). */
  average: number | null
  favoriteCharacter: string | null
  favoriteQuote: string | null
  comment: string | null
}

export type MagazineBook = {
  title: string
  author: string | null
  pages: number | null
  /** data: URL já baixada (ou null → placeholder na cor papel). */
  cover: string | null
}

export type MagazineEdition = {
  number: number
  /** "MAIO", "JUNHO"… */
  month: string
  year: number
  book: MagazineBook
  /** Média geral = média das médias dos membros (bookAverage em src/lib/domain/ratings.ts). */
  average: number | null
  reviews: MemberReview[]
}

export type TrackItem = { book: MagazineBook; average: number | null }

export type OutsideShelf = {
  member: MagazineMember
  books: { book: MagazineBook; average: number | null }[]
}

export type MagazineData = {
  club: { name: string; photo: string | null }
  /** "maio a outubro de 2026" */
  periodLabel: string
  members: MagazineMember[]
  /** Capas do Book Track (edições concluídas e livro em leitura). */
  track: TrackItem[]
  editions: MagazineEdition[]
  outside: OutsideShelf[]
}

export type FontFile = { family: string; src: string; fontWeight?: number }

export type MagazineTemplate = {
  /** Arquivos de fonte (caminhos em /public, ex.: "/fonts/BebasNeue-Regular.ttf"). */
  fonts: FontFile[]
  Document: (props: { data: MagazineData }) => ReactElement
}

/** Conteúdo obrigatório do tokens.json de cada template. */
export type TemplateMeta = { meta: { name: string; description: string } }

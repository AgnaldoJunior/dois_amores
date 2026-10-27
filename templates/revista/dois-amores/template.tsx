/**
 * Template "dois-amores" — revista do clube em páginas horizontais 16:9.
 * Páginas: capa · Book Track · Book Review (uma por livro) · "Enquanto isso, fora do clube…".
 * Todos os valores visuais vêm de ./tokens.json.
 */
import { Document as PdfDocument, Image, Page, Path, Svg, Text, View } from '@react-pdf/renderer'
import type { ReactNode } from 'react'
import { fitText, type FitResult } from '../_shared/fitText'
import type {
  MagazineBook,
  MagazineData,
  MagazineEdition,
  MagazineMember,
  MagazineTemplate,
  MemberReview,
  OutsideShelf,
} from '../_shared/types'
import tokens from './tokens.json'

const C = tokens.color
const F = tokens.font
const S = tokens.size
const PAGE = { width: tokens.page.width, height: tokens.page.height }
const PAD = tokens.page.padding
const INSET = tokens.page.frameInset
const CONTENT_WIDTH = PAGE.width - 2 * PAD

// -----------------------------------------------------------------------------
// utilidades
// -----------------------------------------------------------------------------

export function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}

const padTo = <T,>(items: T[], size: number): (T | null)[] => [
  ...items,
  ...Array.from({ length: Math.max(0, size - items.length) }, () => null),
]

const ddmm = (iso: string | null) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}` : '—')
const formatAverage = (value: number) =>
  value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

// -----------------------------------------------------------------------------
// estrelas (mesmo desenho da interface; meia estrela = metade esquerda preenchida)
// -----------------------------------------------------------------------------

const STAR =
  'M7.60845 0L9.72448 5.08754L15.2169 5.52786L11.0323 9.11246L12.3107 14.4721L7.60845 11.6L2.90617 14.4721L4.18465 9.11246L0 5.52786L5.49243 5.08754L7.60845 0Z'
const HALF_STAR = 'M7.60845 0L5.49243 5.08754L0 5.52786L4.18465 9.11246L2.90617 14.4721L7.60845 11.6Z'

function Stars({ value, size, fill, stroke }: { value: number | null; size: number; fill: string; stroke: string }) {
  const v = Math.round((value ?? 0) * 2) / 2
  return (
    <View style={{ flexDirection: 'row' }}>
      {[0, 1, 2, 3, 4].map((i) => {
        const full = v >= i + 1
        const half = !full && v >= i + 0.5
        return (
          <Svg key={i} width={size} height={(size * 14.4721) / 15.2169} viewBox="0 0 15.2169 14.4721" style={{ marginRight: size * 0.2 }}>
            <Path d={STAR} fill={full ? fill : 'none'} stroke={full ? fill : stroke} strokeWidth={1.2} />
            {half && <Path d={HALF_STAR} fill={fill} />}
          </Svg>
        )
      })}
    </View>
  )
}

// -----------------------------------------------------------------------------
// peças
// -----------------------------------------------------------------------------

/** Capa do livro ou placeholder na cor papel (com o título, para não ficar anônimo). */
function Cover({ book, width, height }: { book: MagazineBook | null; width: number; height: number }) {
  if (book?.cover) return <Image src={book.cover} style={{ width, height, objectFit: 'cover' }} />
  return (
    <View
      style={{
        width,
        height,
        backgroundColor: book ? C.paper : C.placeholder,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 4,
      }}
    >
      {book && (
        <Text style={{ fontFamily: F.display, fontSize: S.placeholderTitle, color: C.green, textAlign: 'center' }}>
          {book.title}
        </Text>
      )}
    </View>
  )
}

/** Foto do membro (ou a inicial) num círculo. */
function MemberPhoto({ member, size, border }: { member: MagazineMember; size: number; border: string }) {
  const style = { width: size, height: size, borderRadius: size / 2, borderWidth: 2, borderColor: border }
  if (member.avatar) return <Image src={member.avatar} style={{ ...style, objectFit: 'cover' }} />
  return (
    <View style={{ ...style, backgroundColor: C.pink, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontFamily: F.display, fontSize: S.initial, color: C.green }}>
        {member.name.trim().charAt(0).toUpperCase()}
      </Text>
    </View>
  )
}

/** Página creme com a moldura rosa e o título cursivo sobre a linha (como a revista original). */
function FramedPage({ title, children, wrap = false }: { title: string; children: ReactNode; wrap?: boolean }) {
  return (
    <Page size={PAGE} wrap={wrap} style={{ backgroundColor: C.cream, fontFamily: F.sans, paddingTop: PAD + 18, paddingHorizontal: PAD, paddingBottom: PAD }}>
      <View
        fixed
        style={{
          position: 'absolute',
          top: INSET,
          left: INSET,
          right: INSET,
          bottom: -INSET * 2,
          borderWidth: 1.2,
          borderColor: C.pink,
          borderRadius: 24,
        }}
      />
      <View fixed style={{ position: 'absolute', top: INSET - S.frameTitle * 0.62, left: 0, right: 0, alignItems: 'center' }}>
        <Text style={{ fontFamily: F.script, fontSize: S.frameTitle, color: C.pink, backgroundColor: C.cream, paddingHorizontal: 14 }}>
          {title}
        </Text>
      </View>
      {children}
    </Page>
  )
}

// -----------------------------------------------------------------------------
// 1. capa
// -----------------------------------------------------------------------------

function CoverPage({ data }: { data: MagazineData }) {
  const stripe = tokens.stripes.width
  const stripes = Math.ceil(PAGE.width / (stripe * 2))
  const visible = data.members.slice(0, 6)
  const stripHeight = 400
  const photo = Math.min(84, (stripHeight - 24) / Math.max(visible.length, 1) - 10)

  return (
    <Page size={PAGE} style={{ backgroundColor: C.cream }}>
      {Array.from({ length: stripes }, (_, i) => (
        <View key={i} style={{ position: 'absolute', top: 0, bottom: 0, left: i * stripe * 2, width: stripe, backgroundColor: C.pinkLight }} />
      ))}

      {/* "ingresso" em papel */}
      <View style={{ position: 'absolute', left: 250, top: 70, width: 620, height: 470, backgroundColor: C.paper, borderRadius: 22 }} />
      <Text style={{ position: 'absolute', left: 340, top: 120, fontFamily: F.hand, fontSize: S.coverNote, color: C.pink, transform: 'rotate(-10deg)' }}>
        clube do livro!
      </Text>

      {/* faixa verde com o nome do clube */}
      <View
        style={{
          position: 'absolute',
          left: 345,
          top: 205,
          width: 430,
          height: 165,
          backgroundColor: C.green,
          borderRadius: 6,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 12,
        }}
      >
        <Text style={{ fontFamily: F.display, fontSize: S.coverTitle, color: C.cream, textAlign: 'center', lineHeight: 1 }}>
          {data.club.name.toUpperCase()}
        </Text>
        <Text style={{ fontFamily: F.script, fontSize: S.coverSubtitle, color: C.pink, marginTop: 4 }}>clube do livro</Text>
      </View>
      <Text
        style={{
          position: 'absolute',
          left: 345,
          top: 400,
          width: 430,
          textAlign: 'center',
          fontFamily: F.mono,
          fontSize: S.period,
          color: C.green,
          letterSpacing: 1.5,
        }}
      >
        {data.periodLabel.toUpperCase()}
      </Text>

      {/* tira de fotos com os membros */}
      <View
        style={{
          position: 'absolute',
          left: 150,
          top: 110,
          width: 130,
          height: stripHeight,
          backgroundColor: C.pink,
          padding: 12,
          justifyContent: 'space-around',
          alignItems: 'center',
          transform: 'rotate(-8deg)',
        }}
      >
        {visible.map((m) => (
          <View key={m.id} style={{ width: photo + 10, height: photo + 10, backgroundColor: C.cream, justifyContent: 'center', alignItems: 'center' }}>
            <MemberPhoto member={m} size={photo} border={C.cream} />
          </View>
        ))}
      </View>

      {/* foto do clube (opcional), como polaroide */}
      {data.club.photo && (
        <View
          style={{
            position: 'absolute',
            left: 760,
            top: 120,
            width: 220,
            height: 200,
            backgroundColor: C.white,
            padding: 9,
            paddingBottom: 26,
            transform: 'rotate(6deg)',
          }}
        >
          <Image src={data.club.photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </View>
      )}
    </Page>
  )
}

// -----------------------------------------------------------------------------
// 2. Book Track
// -----------------------------------------------------------------------------

function BookTrackPages({ data }: { data: MagazineData }) {
  const { columns, rows, coverWidth, coverHeight, gap } = tokens.bookTrack
  const perPage = columns * rows
  const pages = data.track.length ? chunk(data.track, perPage) : [[]]
  return (
    <>
      {pages.map((items, p) => (
        <FramedPage key={p} title="Book Track">
          {chunk(padTo(items, perPage), columns).map((row, r) => (
            <View key={r} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: gap }}>
              {row.map((item, i) => (
                <View key={i} style={{ width: coverWidth, alignItems: 'center' }}>
                  <Cover book={item?.book ?? null} width={coverWidth} height={coverHeight} />
                  <View style={{ marginTop: 4 }}>
                    <Stars value={item?.average ?? null} size={tokens.stars.trackSize} fill={C.pink} stroke={C.pink} />
                  </View>
                </View>
              ))}
            </View>
          ))}
        </FramedPage>
      ))}
    </>
  )
}

// -----------------------------------------------------------------------------
// 3. Book Review
// -----------------------------------------------------------------------------

type Overflow = { member: string; label: string; text: string }

const muted = { fontFamily: F.hand, fontSize: S.handMax, color: C.muted }

function Field({ label, value, style }: { label: string; value: string | null; style?: object }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 0.8,
        borderColor: C.green,
        borderRadius: 3,
        paddingHorizontal: 4,
        paddingVertical: 2,
        marginBottom: 4,
        ...style,
      }}
    >
      <Text style={{ fontFamily: F.mono, fontWeight: 700, fontSize: S.label, color: C.green, letterSpacing: 0.6 }}>{label}: </Text>
      <Text style={value ? { fontFamily: F.hand, fontSize: S.value + 2, color: C.green } : muted}>{value ?? '—'}</Text>
    </View>
  )
}

function RankCell({ label, value }: { label: string; value: number | null }) {
  return (
    <View style={{ width: '50%', alignItems: 'center', marginBottom: 4 }}>
      <Text style={{ fontFamily: F.mono, fontWeight: 700, fontSize: S.label - 0.5, color: C.green, backgroundColor: C.pinkLight, paddingHorizontal: 6, paddingVertical: 1, marginBottom: 2, letterSpacing: 0.6 }}>
        {label}
      </Text>
      <Stars value={value} size={tokens.stars.reviewSize} fill={C.green} stroke={C.green} />
    </View>
  )
}

/** Ajusta um texto à caixa (fonte menor até 8 pt); o resto, se houver, vai para a página de continuação. */
function fitBox(text: string | null, width: number, height: number): FitResult | null {
  if (!text) return null
  const r = tokens.review
  return fitText(text, {
    width: width - 10,
    height: height - 16,
    maxSize: S.handMax,
    minSize: S.handMin,
    charWidthEm: r.charWidthEm,
    lineHeight: r.lineHeight,
  })
}

type ColumnLayout = { quote: FitResult | null; comment: FitResult | null }

/** Calcula o ajuste dos textos de uma coluna antes de desenhar (para saber se haverá continuação). */
function layoutColumn(review: MemberReview, width: number): ColumnLayout {
  const r = tokens.review
  return {
    quote: fitBox(review.favoriteQuote ? `“${review.favoriteQuote}”` : null, width - 12, r.quoteHeight),
    comment: fitBox(review.comment, width - 12, r.commentHeight),
  }
}

/** Caixa de texto manuscrito já ajustada (ou o estado vazio). */
function TextBox(props: { label: string; fit: FitResult | null; empty: string; height: number }) {
  const r = tokens.review
  const content = props.fit ? (
    <Text style={{ fontFamily: F.hand, fontSize: props.fit.fontSize, lineHeight: r.lineHeight, color: C.green }}>{props.fit.text}</Text>
  ) : (
    <Text style={muted}>{props.empty}</Text>
  )
  return (
    <View style={{ height: props.height, borderWidth: 0.8, borderColor: C.green, borderRadius: 3, padding: 4, marginBottom: 4 }}>
      <Text style={{ fontFamily: F.mono, fontWeight: 700, fontSize: S.label, color: C.green, letterSpacing: 0.6, marginBottom: 2 }}>
        {props.label.toUpperCase()}:
      </Text>
      {content}
    </View>
  )
}

function MemberColumn({ review, book, width, layout }: { review: MemberReview; book: MagazineBook; width: number; layout: ColumnLayout }) {
  const r = tokens.review
  const registered = review.startedOn != null
  return (
    <View style={{ width, backgroundColor: C.paper, borderRadius: 4 }}>
      <View style={{ backgroundColor: C.green, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3 }}>
        <Text style={{ fontFamily: F.script, fontSize: S.memberName, color: C.cream }}>{review.memberName}</Text>
        <Stars value={review.average} size={tokens.stars.headerSize} fill={C.white} stroke={C.white} />
      </View>
      <View style={{ padding: 6 }}>
        <Field label="AUTOR" value={book.author} />
        <Field label="Nº PÁGINAS" value={book.pages ? String(book.pages) : null} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Field label="INÍCIO" value={registered ? ddmm(review.startedOn) : null} style={{ width: '48%' }} />
          <Field label="FIM" value={review.finishedOn ? ddmm(review.finishedOn) : null} style={{ width: '48%' }} />
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginVertical: 2 }}>
          <RankCell label="PERSONAGENS" value={review.ranks.characters} />
          <RankCell label="PLOT" value={review.ranks.plot} />
          <RankCell label="ESCRITA" value={review.ranks.writing} />
          <RankCell label="FINAL" value={review.ranks.ending} />
        </View>
        <Field label="PERSONAGEM FAV" value={review.favoriteCharacter} />
        <TextBox
          label="Citação favorita"
          fit={layout.quote}
          empty={registered ? 'sem citação desta vez' : 'leitura não registrada'}
          height={r.quoteHeight}
        />
        <TextBox
          label="Comentários"
          fit={layout.comment}
          empty={registered ? 'sem comentários' : 'leitura não registrada'}
          height={r.commentHeight}
        />
      </View>
    </View>
  )
}

function ReviewHeader({ edition, part }: { edition: MagazineEdition; part: string }) {
  const r = tokens.review
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: -PAD + 4, marginBottom: 10, height: r.coverHeight + 6 }}>
      {/* selo com a capa */}
      <View style={{ backgroundColor: C.white, padding: 3, borderWidth: 1, borderStyle: 'dashed', borderColor: C.green }}>
        <Cover book={edition.book} width={r.coverWidth} height={r.coverHeight} />
      </View>
      <View style={{ marginLeft: 12, justifyContent: 'flex-end', height: r.coverHeight }}>
        <View style={{ backgroundColor: C.pink, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 3, maxWidth: 330 }}>
          <Text style={{ fontFamily: F.mono, fontWeight: 700, fontSize: S.pill, color: C.white, letterSpacing: 1 }}>
            {edition.book.title.toUpperCase()}
            {part}
          </Text>
        </View>
      </View>
      {/* carimbo: mês/ano e número */}
      {/* largura fixa: texto girado sem largura definida quebra e sobrepõe as linhas no react-pdf */}
      <View style={{ position: 'absolute', left: CONTENT_WIDTH / 2 + 70, top: 16, width: 150, transform: 'rotate(-8deg)' }}>
        <Text style={{ fontFamily: F.mono, fontWeight: 700, fontSize: S.stamp, color: C.green, letterSpacing: 1, textAlign: 'center', lineHeight: 1.3 }}>
          {`${edition.month} ${edition.year}\nNo.${String(edition.number).padStart(2, '0')}`}
        </Text>
      </View>
      {/* média geral (média das médias) */}
      <View style={{ position: 'absolute', right: 0, top: 26, width: 160, alignItems: 'flex-end' }}>
        <Stars value={edition.average} size={tokens.stars.averageSize} fill={C.green} stroke={C.green} />
        <Text style={{ fontFamily: F.mono, fontSize: S.average, color: C.green, marginTop: 2, textAlign: 'right', width: 160 }}>
          {edition.average == null ? 'sem notas' : `média ${formatAverage(edition.average)}`}
        </Text>
      </View>
    </View>
  )
}

function ReviewPages({ edition }: { edition: MagazineEdition }) {
  const r = tokens.review
  const groups = chunk(edition.reviews, r.maxColumns)
  const overflow: Overflow[] = []
  const pages = groups.map((group, g) => {
    const width = Math.min(260, (CONTENT_WIDTH - r.gap * (group.length - 1)) / group.length)
    const part = groups.length > 1 ? ` (${g + 1}/${groups.length})` : ''
    const layouts = group.map((review) => {
      const layout = layoutColumn(review, width)
      if (layout.quote?.overflow) overflow.push({ member: review.memberName, label: 'Citação favorita', text: layout.quote.overflow })
      if (layout.comment?.overflow) overflow.push({ member: review.memberName, label: 'Comentários', text: layout.comment.overflow })
      return layout
    })
    return (
      <FramedPage key={g} title="Book Review">
        <ReviewHeader edition={edition} part={part} />
        <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
          {group.map((review, i) => (
            <View key={review.memberId} style={{ marginLeft: i === 0 ? 0 : r.gap }}>
              <MemberColumn review={review} book={edition.book} width={width} layout={layouts[i]!} />
            </View>
          ))}
        </View>
      </FramedPage>
    )
  })

  // Textos que não couberam nem em 8 pt continuam numa página extra.
  if (overflow.length) {
    pages.push(
      <FramedPage key="cont" title="Book Review" wrap>
        <Text style={{ fontFamily: F.mono, fontWeight: 700, fontSize: S.pill, color: C.green, letterSpacing: 1, marginBottom: 12 }}>
          {edition.book.title.toUpperCase()} · CONTINUAÇÃO
        </Text>
        {overflow.map((o, i) => (
          <View key={i} style={{ marginBottom: 12 }}>
            <Text style={{ fontFamily: F.script, fontSize: S.memberName, color: C.green }}>
              {o.member} <Text style={{ fontFamily: F.mono, fontSize: S.label, letterSpacing: 0.6 }}>· {o.label.toUpperCase()} (cont.)</Text>
            </Text>
            <Text style={{ fontFamily: F.hand, fontSize: S.continuation, lineHeight: r.lineHeight, color: C.green }}>… {o.text}</Text>
          </View>
        ))}
      </FramedPage>,
    )
  }
  return <>{pages}</>
}

// -----------------------------------------------------------------------------
// 4. Enquanto isso, fora do clube…
// -----------------------------------------------------------------------------

type Panel = { shelf: OutsideShelf; books: OutsideShelf['books']; part: number; parts: number }

/** Divide prateleiras grandes em mais de um painel (cada painel = uma grade cheia). */
export function outsidePanels(shelves: OutsideShelf[], perPanel: number): Panel[] {
  return shelves.flatMap((shelf) => {
    const parts = shelf.books.length ? chunk(shelf.books, perPanel) : [[]]
    return parts.map((books, i) => ({ shelf, books, part: i + 1, parts: parts.length }))
  })
}

function OutsidePanel({ panel, width }: { panel: Panel; width: number }) {
  const o = tokens.outside
  const perPanel = o.columns * o.rows
  return (
    <View style={{ width, borderWidth: 1.2, borderColor: C.green, borderRadius: 18, paddingTop: 34, paddingHorizontal: 16, paddingBottom: 8, minHeight: 470 }}>
      <View style={{ position: 'absolute', left: -12, top: -18 }}>
        <MemberPhoto member={panel.shelf.member} size={o.avatarSize} border={C.green} />
      </View>
      <Text style={{ position: 'absolute', right: 16, top: 2, fontFamily: F.script, fontSize: S.outsideName, color: C.green }}>
        {panel.shelf.member.name}
        {panel.parts > 1 ? ` (${panel.part}/${panel.parts})` : ''}
      </Text>
      {panel.books.length === 0 && (
        <Text style={{ ...muted, textAlign: 'center', marginBottom: 8 }}>nenhuma leitura fora do clube neste período</Text>
      )}
      {chunk(padTo(panel.books, perPanel), o.columns).map((row, r) => (
        <View key={r} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: o.gap }}>
          {row.map((item, i) => (
            <View key={i} style={{ width: o.coverWidth, alignItems: 'center' }}>
              <Cover book={item?.book ?? null} width={o.coverWidth} height={o.coverHeight} />
              <View style={{ marginTop: 3 }}>
                <Stars value={item?.average ?? null} size={tokens.stars.outsideSize} fill={C.green} stroke={C.green} />
              </View>
            </View>
          ))}
        </View>
      ))}
    </View>
  )
}

function OutsidePages({ data }: { data: MagazineData }) {
  const o = tokens.outside
  const panels = outsidePanels(data.outside, o.columns * o.rows)
  const width = (CONTENT_WIDTH - 40 * (o.membersPerPage - 1)) / o.membersPerPage
  return (
    <>
      {chunk(panels, o.membersPerPage).map((group, p) => (
        <FramedPage key={p} title="Enquanto isso, fora do clube...">
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
            {group.map((panel) => (
              <OutsidePanel key={`${panel.shelf.member.id}-${panel.part}`} panel={panel} width={width} />
            ))}
          </View>
        </FramedPage>
      ))}
    </>
  )
}

// -----------------------------------------------------------------------------
// documento
// -----------------------------------------------------------------------------

function DoisAmoresMagazine({ data }: { data: MagazineData }) {
  return (
    <PdfDocument title={`${data.club.name} · revista do clube`} author="Dois Amores" language="pt-BR">
      <CoverPage data={data} />
      <BookTrackPages data={data} />
      {data.editions.map((edition) => (
        <ReviewPages key={edition.number} edition={edition} />
      ))}
      <OutsidePages data={data} />
    </PdfDocument>
  )
}

const template: MagazineTemplate = {
  fonts: [
    { family: F.display, src: '/fonts/BebasNeue-Regular.ttf' },
    { family: F.script, src: '/fonts/PinyonScript-Regular.ttf' },
    { family: F.mono, src: '/fonts/CourierPrime-Regular.ttf', fontWeight: 400 },
    { family: F.mono, src: '/fonts/CourierPrime-Bold.ttf', fontWeight: 700 },
    { family: F.hand, src: '/fonts/Caveat-Regular.ttf' },
    { family: F.sans, src: '/fonts/Inter-Regular.ttf' },
  ],
  Document: DoisAmoresMagazine,
}

export default template

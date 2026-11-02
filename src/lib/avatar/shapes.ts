import { tokens } from '@/theme/tokens'
import type { AvatarConfig } from './config'

/**
 * Desenho do avatar ilustrado (viewBox 200 × 200) como lista de formas. A mesma
 * lista vira React no app (IllustratedAvatar) e texto SVG para a revista em PDF.
 */
export type Shape = { tag: 'path' | 'circle' | 'ellipse' | 'rect' | 'polygon'; attrs: Record<string, string | number> }

export const AVATAR_VIEWBOX = 200

const A = tokens.avatar

/** Estrela de 6 pontas (12 vértices alternando raio externo e interno). */
export function starPoints(cx: number, cy: number, outer: number, inner: number, rotation: number) {
  return Array.from({ length: 12 }, (_, i) => {
    const angle = (Math.PI / 6) * i + rotation
    const radius = i % 2 ? inner : outer
    return `${(cx + radius * Math.cos(angle)).toFixed(1)},${(cy + radius * Math.sin(angle)).toFixed(1)}`
  }).join(' ')
}

const path = (d: string, attrs: Record<string, string | number>): Shape => ({ tag: 'path', attrs: { d, ...attrs } })
const circle = (cx: number, cy: number, r: number, attrs: Record<string, string | number>): Shape => ({ tag: 'circle', attrs: { cx, cy, r, ...attrs } })
const ellipse = (cx: number, cy: number, rx: number, ry: number, attrs: Record<string, string | number>): Shape => ({ tag: 'ellipse', attrs: { cx, cy, rx, ry, ...attrs } })

export function avatarShapes(config: AvatarConfig): Shape[] {
  const skin = A.skin[config.skin]!
  const hair = { fill: A.hair[config.hair]!.fill }
  const style = config.style
  const shapes: Shape[] = []

  // Cabelo de trás
  if (style === 'long' || style === 'fringe') shapes.push(path('M50 110 Q46 50 100 48 Q154 50 150 110 L158 200 L42 200 Z', hair))
  if (style === 'wavy')
    shapes.push(path('M48 108 Q44 48 100 46 Q156 48 152 108 Q168 124 152 142 Q168 160 152 178 Q166 192 150 200 L50 200 Q34 192 48 178 Q32 160 48 142 Q32 124 48 108Z', hair))
  if (style === 'bob') shapes.push(path('M48 108 Q44 50 100 48 Q156 50 152 108 L154 150 Q126 158 100 156 Q74 158 46 150Z', hair))
  if (style === 'bun') shapes.push(circle(100, 40, 22, hair))

  // Pescoço, blusa, gola e rosto
  shapes.push({ tag: 'rect', attrs: { x: 88, y: 146, width: 24, height: 26, fill: skin.shade } })
  shapes.push(path('M50 200 Q54 164 100 162 Q146 164 150 200Z', { fill: A.shirt[config.shirt]!.fill }))
  shapes.push(path('M88 163 L100 178 L112 163', { fill: 'none', stroke: A.paper, 'stroke-width': 3, 'stroke-linejoin': 'round' }))
  shapes.push(ellipse(100, 108, 46, 48, { fill: skin.fill }))

  // Cabelo da frente
  if (style === 'long' || style === 'wavy' || style === 'bob')
    shapes.push(path('M52 108 Q50 54 100 52 Q150 54 148 108 Q140 82 114 70 Q106 80 100 68 Q94 80 86 70 Q60 82 52 108Z', hair))
  if (style === 'fringe') shapes.push(path('M52 104 Q50 52 100 50 Q150 52 148 104 L146 94 Q100 82 54 94 Z', hair))
  if (style === 'bun') shapes.push(path('M54 100 Q54 56 100 56 Q146 56 146 100 Q140 76 100 74 Q60 76 54 100Z', hair))

  // Olhos, bochechas, nariz e boca
  shapes.push(circle(82, 112, 8, { fill: A.eye }), circle(118, 112, 8, { fill: A.eye }))
  shapes.push(circle(84.5, 109.5, 2.4, { fill: A.paper }), circle(120.5, 109.5, 2.4, { fill: A.paper }))
  shapes.push(ellipse(70, 128, 9, 5, { fill: A.blush, opacity: 0.55 }), ellipse(130, 128, 9, 5, { fill: A.blush, opacity: 0.55 }))
  shapes.push(ellipse(100, 124, 3, 2, { fill: skin.shade }))
  shapes.push(path('M93 134 Q100 140 107 134', { fill: 'none', stroke: A.mouth, 'stroke-width': 2.2, 'stroke-linecap': 'round' }))

  // Óculos
  const frame = { fill: 'none', stroke: A.frame, 'stroke-width': 2.4 }
  if (config.glasses === 'round') shapes.push(circle(82, 112, 15, frame), circle(118, 112, 15, frame), path('M97 110 Q100 107 103 110', frame))
  if (config.glasses === 'square')
    shapes.push(
      { tag: 'rect', attrs: { x: 66, y: 99, width: 31, height: 25, rx: 5, ...frame } },
      { tag: 'rect', attrs: { x: 103, y: 99, width: 31, height: 25, rx: 5, ...frame } },
      path('M97 108 L103 108', frame),
    )
  if (config.glasses === 'cat') {
    const cat = { fill: 'none', stroke: A.accent, 'stroke-width': 2.8, 'stroke-linejoin': 'round' }
    shapes.push(
      path('M62 102 Q66 100 80 101 Q96 100 96 108 Q96 122 82 122 Q68 122 66 110Z', cat),
      path('M138 102 Q134 100 120 101 Q104 100 104 108 Q104 122 118 122 Q132 122 134 110Z', cat),
      path('M96 108 Q100 105 104 108', cat),
    )
  }

  // Extras
  if (config.extras === 'bow' || config.extras === 'both') {
    const bow = { fill: A.bow, stroke: A.bowLine, 'stroke-width': 1.5, 'stroke-linejoin': 'round' }
    shapes.push(path('M132 62 L114 50 L116 74Z', bow), path('M132 62 L150 50 L148 74Z', bow), circle(132, 62, 5, bow))
  }
  if (config.extras === 'stars' || config.extras === 'both') {
    const fill = { fill: A.accent }
    shapes.push(
      { tag: 'polygon', attrs: { points: starPoints(30, 42, 16, 6, 0.2), ...fill } },
      { tag: 'polygon', attrs: { points: starPoints(172, 150, 14, 5, 0.5), ...fill } },
      { tag: 'polygon', attrs: { points: starPoints(168, 30, 8, 3, 0), ...fill } },
    )
  }
  return shapes
}

const escape = (v: string | number) => String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

/** SVG completo (com o fundo de papel) para rasterizar na revista. */
export function avatarSvg(config: AvatarConfig): string {
  const body = avatarShapes(config)
    .map(({ tag, attrs }) => `<${tag} ${Object.entries(attrs).map(([k, v]) => `${k}="${escape(v)}"`).join(' ')}/>`)
    .join('')
  const size = AVATAR_VIEWBOX
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
    `<rect width="${size}" height="${size}" fill="${A.paper}"/>${body}</svg>`
  )
}

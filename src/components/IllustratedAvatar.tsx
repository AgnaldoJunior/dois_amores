import { createElement } from 'react'
import type { AvatarConfig } from '@/lib/avatar/config'
import { AVATAR_VIEWBOX, avatarShapes } from '@/lib/avatar/shapes'
import { tokens } from '@/theme/tokens'

const camel = (key: string) => key.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())

/** Avatar ilustrado em SVG. Sem `label`, é decorativo (o nome aparece ao lado). */
export function IllustratedAvatar({ config, className = '', label }: { config: AvatarConfig; className?: string; label?: string }) {
  return (
    <svg
      viewBox={`0 0 ${AVATAR_VIEWBOX} ${AVATAR_VIEWBOX}`}
      className={className}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <rect width={AVATAR_VIEWBOX} height={AVATAR_VIEWBOX} fill={tokens.avatar.paper} />
      {avatarShapes(config).map(({ tag, attrs }, i) =>
        createElement(tag, { key: i, ...Object.fromEntries(Object.entries(attrs).map(([k, v]) => [camel(k), v])) }),
      )}
    </svg>
  )
}

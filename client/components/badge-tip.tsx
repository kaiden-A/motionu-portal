import type { ReactNode } from 'react'
import type { Achievement } from '@/lib/types'

/** Wraps a badge glyph with a hover tooltip showing its title + description. */
export function BadgeTip({
  badge,
  children,
}: {
  badge: Achievement
  children: ReactNode
}) {
  return (
    <span className="badge-tip">
      {children}
      <span className="badge-tip__pop" role="tooltip">
        <span className="badge-tip__title">{badge.label}</span>
        {badge.desc && <span className="badge-tip__desc">{badge.desc}</span>}
      </span>
    </span>
  )
}

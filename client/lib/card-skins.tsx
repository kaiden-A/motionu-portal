import type { CSSProperties, ReactNode } from 'react'
import { Avatar } from '@/components/avatar'
import { IdBadge } from '@/components/badge'
import { LanyardCard } from '@/components/lanyard-card'
import { AppIcon } from '@/components/icon-picker'
import type { Achievement, MemberPublic } from '@/lib/types'

export interface CardSkinProps {
  member: MemberPublic
  uid?: string | null
  deptKey?: string | null
  lastTap?: string | null
  badges?: Achievement[]
  accent?: string | null
  tilt?: boolean
}

export interface CardSkin {
  id: string
  name: string
  description: string
  render: (props: CardSkinProps) => ReactNode
}

function MinimalCard({ member, uid, deptKey, badges, accent }: CardSkinProps) {
  const dept = deptKey ?? member.dept ?? undefined
  return (
    <div
      className="minimal-card"
      data-dept={dept ?? ''}
      style={accent ? ({ '--dept-color': accent } as CSSProperties) : undefined}
    >
      <div className="minimal-card__bar" />
      <div className="minimal-card__body">
        <span className="minimal-card__org">MOTION-U</span>
        <Avatar
          className="minimal-card__photo"
          name={member.name}
          initials={member.initials || 'MU'}
          avatarUrl={member.avatar_url}
          dept={dept}
        />
        <div className="minimal-card__name">{member.name}</div>
        <div className="minimal-card__role">{member.role || 'Member'}</div>
        {badges && badges.length > 0 && (
          <div className="minimal-card__badges" role="list" aria-label="Badges earned">
            {badges.slice(0, 5).map((b) => (
              <span key={b.key} className="minimal-card__badge" role="listitem">
                <AppIcon icon={b.icon} />
              </span>
            ))}
          </div>
        )}
        <div className="minimal-card__footer">
          <span className="minimal-card__uid">UID · {uid ?? '—'}</span>
        </div>
      </div>
    </div>
  )
}

export const CARD_SKINS: CardSkin[] = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'The original credential — badge layout with a bold accent.',
    render: (props) => (
      <IdBadge
        member={props.member}
        uid={props.uid}
        deptKey={props.deptKey}
        badges={props.badges}
        accent={props.accent}
        tilt={props.tilt}
      />
    ),
  },
  {
    id: 'lanyard',
    name: 'Lanyard',
    description: 'The tall portrait card from the public page.',
    render: (props) => (
      <LanyardCard
        member={props.member}
        uid={props.uid}
        deptKey={props.deptKey}
        lastTap={props.lastTap}
        badges={props.badges}
        accent={props.accent}
      />
    ),
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean and flat — big name, round photo, one accent line.',
    render: (props) => <MinimalCard {...props} />,
  },
]

export function resolveSkin(id?: string | null): CardSkin {
  return CARD_SKINS.find((s) => s.id === id) ?? CARD_SKINS[0]
}

import type { CSSProperties } from 'react'
import { Avatar } from '@/components/avatar'
import { BadgeTip } from '@/components/badge-tip'
import { AppIcon } from '@/components/icon-picker'
import { ROLE_SHORT, type Achievement, type MemberPublic } from '@/lib/types'
import { iconFa } from '@/lib/icons'

const NFC_ICON = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M4 7v10M8 9v6M12 6v12M16 10v4M20 8v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

const ROLE_DEPT_KEY: Record<string, string> = {
  mainboards: 'mainboard',
  techops: 'techops',
  mulcom: 'multimedia',
  Inter: 'internal',
  entrep: 'entrepreneur',
}

export function RoleChips({ roles, showMember = true }: { roles?: string[]; showMember?: boolean }) {
  if (!roles?.length) return null
  const visible = showMember ? roles : roles.filter((r) => r !== 'member')
  if (!visible.length) return null
  return (
    <div className="role-chips">
      {visible.map((r) => (
        <span
          key={r}
          className={`role-chip ${r === 'super_admin' ? 'is-admin' : ''}`}
          data-dept={ROLE_DEPT_KEY[r] ?? ''}
        >
          {ROLE_SHORT[r] ?? r}
        </span>
      ))}
    </div>
  )
}

export function IdBadge({
  member,
  uid,
  size = 'md',
  tilt = false,
  deptKey,
  badges = [],
  accent = null,
}: {
  member: MemberPublic
  uid?: string | null
  size?: 'sm' | 'md'
  tilt?: boolean
  deptKey?: string | null
  badges?: Achievement[]
  accent?: string | null
}) {
  const dept = deptKey ?? member.dept ?? undefined
  const sizeClass = size === 'sm' ? 'id-badge--sm' : ''
  const tiltClass = tilt ? 'id-badge--tilt' : ''

  return (
    <div
      className={`id-badge ${sizeClass} ${tiltClass}`}
      data-dept={dept ?? ''}
      style={accent ? ({ '--dept-color': accent } as CSSProperties) : undefined}
    >
      {size !== 'sm' && <div className="id-badge__punch" />}
      <div className="id-badge__row-top">
        <span className="id-badge__org">MOTION-U</span>
        <span className="id-badge__type">
          {(member.department?.short ?? dept ?? 'MEMBER').toUpperCase()}
        </span>
      </div>
      <Avatar
        className="id-badge__photo"
        name={member.name}
        initials={member.initials || 'MU'}
        avatarUrl={member.avatar_url}
        dept={dept}
      />
      <div className="id-badge__name">{member.name}</div>
      <div className="id-badge__role">{member.role || 'Member'}</div>
      <RoleChips roles={member.roles} />
      {badges.length > 0 && size !== 'sm' && (
        <div className="id-badge__badges" role="list" aria-label="Badges earned">
          {badges.map((b) => (
            <BadgeTip key={b.key} badge={b}>
              <span className="id-badge__badge" role="listitem">
                <AppIcon icon={b.icon} />
              </span>
            </BadgeTip>
          ))}
        </div>
      )}
      <div className="id-badge__footer">
        <span className="id-badge__uid">UID · {uid ?? '—'}</span>
        <span className="id-badge__nfc">{NFC_ICON}</span>
      </div>
    </div>
  )
}

export function Achievement({ label, desc, icon }: { label: string; desc?: string; icon?: string }) {
  return (
    <div className="achievement">
      <div className="achievement__icon">
        <i className={`fa-solid ${iconFa(icon ?? 'award')}`} aria-hidden />
      </div>
      <div className="achievement__body">
        <div className="achievement__title">{label}</div>
        {desc && <div className="achievement__meta">{desc}</div>}
      </div>
    </div>
  )
}

export function StatusPill({ assigned }: { assigned: boolean }) {
  return (
    <span className={`status-pill ${assigned ? 'active' : 'unassigned'}`}>
      {assigned ? 'Active card' : 'Unassigned'}
    </span>
  )
}

const MEMBERSHIP_STATUS_CLASS: Record<string, string> = {
  active: 'active',
  pending: 'unassigned',
  expired: 'expired',
  cancelled: 'expired',
}

export function MembershipStatusPill({ status }: { status: string }) {
  return (
    <span className={`status-pill ${MEMBERSHIP_STATUS_CLASS[status] ?? 'unassigned'}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

export function DeptTag({ short }: { short?: string | null }) {
  if (!short) return null
  return <span className="dept-tag">{short}</span>
}

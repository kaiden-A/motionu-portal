import { ROLE_SHORT, type MemberPublic } from '@/lib/types'

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
}: {
  member: MemberPublic
  uid?: string | null
  size?: 'sm' | 'md'
  tilt?: boolean
  deptKey?: string | null
}) {
  const dept = deptKey ?? member.dept ?? undefined
  const sizeClass = size === 'sm' ? 'id-badge--sm' : ''
  const tiltClass = tilt ? 'id-badge--tilt' : ''

  return (
    <div className={`id-badge ${sizeClass} ${tiltClass}`} data-dept={dept ?? ''}>
      {size !== 'sm' && <div className="id-badge__punch" />}
      <div className="id-badge__row-top">
        <span className="id-badge__org">MOTION-U</span>
        <span className="id-badge__type">
          {(member.department?.short ?? dept ?? 'MEMBER').toUpperCase()}
        </span>
      </div>
      <div className="id-badge__photo">{member.initials || 'MU'}</div>
      <div className="id-badge__name">{member.name}</div>
      <div className="id-badge__role">{member.role || 'Member'}</div>
      <RoleChips roles={member.roles} />
      <div className="id-badge__footer">
        <span className="id-badge__uid">UID · {uid ?? '—'}</span>
        <span className="id-badge__nfc">{NFC_ICON}</span>
      </div>
    </div>
  )
}

export function Achievement({ label, desc }: { label: string; desc?: string }) {
  return (
    <div className="achievement">
      <div className="achievement__icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M12 2l2.4 5.1 5.6.7-4.1 3.9 1 5.6-4.9-2.7-4.9 2.7 1-5.6L4 7.8l5.6-.7L12 2z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
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

export function DeptTag({ short }: { short?: string | null }) {
  if (!short) return null
  return <span className="dept-tag">{short}</span>
}

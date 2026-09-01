import type { CSSProperties } from 'react'
import { BadgeTip } from '@/components/badge-tip'
import { AppIcon } from '@/components/icon-picker'
import { ROLE_SHORT, type Achievement, type MemberPublic } from '@/lib/types'

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

export function LanyardCard({
  member,
  uid,
  deptKey,
  lastTap,
  badges = [],
  accent = null,
}: {
  member: MemberPublic
  uid?: string | null
  deptKey?: string | null
  lastTap?: string | null
  badges?: Achievement[]
  accent?: string | null
}) {
  const dept = deptKey ?? member.dept ?? undefined
  // Access scopes = roles beyond the base `member` grant, beyond the
  // department already shown in the top badge, and beyond the role title
  // shown under the name — no duplicate labels anywhere.
  const scopes = (member.roles || []).filter(
    (r) =>
      r !== 'member' &&
      ROLE_DEPT_KEY[r] !== dept &&
      (ROLE_SHORT[r] ?? r) !== (member.role || 'Member')
  )

  const memberSince = member.member_since
    ? new Date(member.member_since).toLocaleDateString(undefined, {
        month: 'short',
        year: 'numeric',
      })
    : null

  return (
    <div
      className="lanyard-card"
      data-dept={dept ?? ''}
      style={accent ? ({ '--dept-color': accent } as CSSProperties) : undefined}
    >
      <div className="lanyard-card__punch" />
      <div className="lanyard-card__body">
        <div className="lanyard-card__row-top">
          <span className="lanyard-card__org">MOTION-U</span>
          <span className="lanyard-card__type">
            {(member.department?.short ?? dept ?? 'MEMBER').toUpperCase()}
          </span>
        </div>

        <div className="lanyard-card__main">
          <div className="lanyard-card__photo">{member.initials || 'MU'}</div>
          <div className="lanyard-card__name">{member.name}</div>
          <div className="lanyard-card__role">{member.role || 'Member'}</div>
          {scopes.length > 0 && (
            <div className="lanyard-card__chips" role="list" aria-label="Access scopes">
              {scopes.map((r) => (
                <span
                  key={r}
                  className={`lanyard-card__chip ${r === 'super_admin' ? 'is-admin' : ''}`}
                  role="listitem"
                >
                  {ROLE_SHORT[r] ?? r}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="lanyard-card__meta">
          {memberSince && (
            <div className="lanyard-card__meta-item">
              <span className="lanyard-card__meta-label">Member since</span>
              <span className="lanyard-card__meta-value">{memberSince}</span>
            </div>
          )}
          {lastTap && (
            <div className="lanyard-card__meta-item">
              <span className="lanyard-card__meta-label">Last tap</span>
              <span className="lanyard-card__meta-value">{lastTap}</span>
            </div>
          )}
        </div>

        {badges.length > 0 && (
          <div className="lanyard-card__badges" role="list" aria-label="Badges earned">
            {badges.map((b) => (
              <BadgeTip key={b.key} badge={b}>
                <span className="lanyard-card__badge" role="listitem">
                  <AppIcon icon={b.icon} />
                </span>
              </BadgeTip>
            ))}
          </div>
        )}

        <div className="lanyard-card__footer">
          <span className="lanyard-card__uid">UID · {uid ?? '—'}</span>
          <span className="lanyard-card__nfc">
            {NFC_ICON}
            NFC
          </span>
        </div>
      </div>
    </div>
  )
}

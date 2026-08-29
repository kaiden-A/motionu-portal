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

export function LanyardCard({
  member,
  uid,
  deptKey,
}: {
  member: MemberPublic
  uid?: string | null
  deptKey?: string | null
}) {
  const dept = deptKey ?? member.dept ?? undefined
  const roles = (member.roles || []).filter((r) => r !== 'member')

  return (
    <div className="lanyard-card" data-dept={dept ?? ''}>
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
          <div className="lanyard-card__info">
            <div className="lanyard-card__name">{member.name}</div>
            <div className="lanyard-card__role">{member.role || 'Member'}</div>
            {member.department && (
              <div className="lanyard-card__dept">
                <span className="dept-tag" data-dept={dept}>
                  {member.department.short}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="lanyard-card__footer">
          <span className="lanyard-card__uid">UID · {uid ?? '—'}</span>
          <span className="lanyard-card__nfc">
            {roles.length ? (
              roles.slice(0, 2).map((r) => (
                <span key={r} className="role-chip" data-dept={ROLE_DEPT_KEY[r] ?? ''}>
                  {ROLE_SHORT[r] ?? r}
                </span>
              ))
            ) : null}
            {NFC_ICON}
          </span>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Avatar } from '@/components/avatar'
import { BadgeTip } from '@/components/badge-tip'
import { GiveBadgeModal } from '@/components/give-badge-modal'
import { AppIcon } from '@/components/icon-picker'
import { ROLE_SHORT, DEPARTMENTS, type Achievement, type MemberDirectoryItem } from '@/lib/types'

const ROLE_DEPT_KEY: Record<string, string> = {
  mainboards: 'mainboard',
  techops: 'techops',
  mulcom: 'multimedia',
  Inter: 'internal',
  entrep: 'entrepreneur',
}

export function MembersGrid({
  members,
  badges = [],
  currentSub = null,
}: {
  members: MemberDirectoryItem[]
  badges?: Achievement[]
  currentSub?: string | null
}) {
  const [query, setQuery] = useState('')
  const [dept, setDept] = useState('all')
  const [givingTo, setGivingTo] = useState<MemberDirectoryItem | null>(null)

  const filtered = members.filter((m) => {
    const matchesDept = dept === 'all' || m.dept === dept
    const haystack = `${m.name} ${m.role ?? ''} ${(m.roles || []).join(' ')}`.toLowerCase()
    const matchesQuery = !query || haystack.includes(query.toLowerCase())
    return matchesDept && matchesQuery
  })

  return (
    <>
      <div className="filter-bar">
        <div className="search-box">
          <i className="fa-solid fa-magnifying-glass" />
          <input
            type="text"
            placeholder="Search by name or role…"
            aria-label="Search members by name or role"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="chip-row">
          {[{ key: 'all', short: 'All' }, ...DEPARTMENTS].map((d) => (
            <button
              key={d.key}
              className={`chip ${dept === d.key ? 'is-active' : ''}`}
              onClick={() => setDept(d.key)}
            >
              {d.key !== 'all' && <span className="chip-dot" data-dept={d.key} />}
              {d.short}
            </button>
          ))}
        </div>
      </div>

      <div className="member-list" style={{ gap: 10 }}>
        {filtered.map((m) => {
          const roles = (m.roles || []).filter((r) => r !== 'member')
          const earned = (m.achievements ?? [])
            .map((key) => badges.find((b) => b.key === key))
            .filter((b): b is Achievement => !!b)
          return (
            <div key={m.zitadel_sub ?? m.name} className="member-row" data-dept={m.dept ?? ''}>
              <Avatar
                className="member-row__avatar"
                name={m.name}
                initials={m.initials}
                avatarUrl={m.avatar_url}
                dept={m.dept}
              />
              <div className="member-row__body">
                <div className="member-row__name">{m.name}</div>
                <div className="member-row__roles">
                  {roles.length ? (
                    roles.map((r) => (
                      <span key={r} className={`role-chip ${r === 'super_admin' ? 'is-admin' : ''}`} data-dept={ROLE_DEPT_KEY[r] ?? ''}>
                        {ROLE_SHORT[r] ?? r}
                      </span>
                    ))
                  ) : (
                    <span className="role-chip">Member</span>
                  )}
                  {earned.length > 0 && (
                    <span className="member-row__badges" role="list" aria-label="Badges earned">
                      {earned.map((b) => (
                        <BadgeTip key={b.key} badge={b}>
                          <span className="member-row__badge" role="listitem">
                            <AppIcon icon={b.icon} />
                          </span>
                        </BadgeTip>
                      ))}
                    </span>
                  )}
                </div>
              </div>
              <div className="member-row__side">
                {m.dept && (
                  <span className="dept-tag" data-dept={m.dept}>
                    {m.department?.short ?? m.dept}
                  </span>
                )}
                {m.zitadel_sub !== currentSub && (
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setGivingTo(m)}
                    title={`Give badges to ${m.name}`}
                  >
                    <i className="fa-solid fa-award" /> Give
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
      {!filtered.length && (
        <p className="text-faint mt-8">No members match that search.</p>
      )}

      {givingTo && (
        <GiveBadgeModal member={givingTo} badges={badges} onClose={() => setGivingTo(null)} />
      )}
    </>
  )
}

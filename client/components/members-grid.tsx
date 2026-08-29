'use client'

import { useState } from 'react'
import { IdBadge, RoleChips } from '@/components/badge'
import { DEPARTMENTS, type MemberDirectoryItem } from '@/lib/types'

export function MembersGrid({ members }: { members: MemberDirectoryItem[] }) {
  const [query, setQuery] = useState('')
  const [dept, setDept] = useState('all')

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

      <div className="grid grid-4" id="mu-member-grid">
        {filtered.map((m) => (
          <div key={m.zitadel_sub ?? m.name} className="panel">
            <IdBadge member={m} size="sm" deptKey={m.dept} />
            <RoleChips roles={m.roles} />
          </div>
        ))}
      </div>
      {!filtered.length && (
        <p className="text-faint mt-32">No members match that search.</p>
      )}
    </>
  )
}

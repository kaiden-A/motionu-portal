'use client'

import { useState } from 'react'
import { AppsManageModal } from '@/components/apps-manage-modal'
import { DEPARTMENTS, type AppPublic } from '@/lib/types'

const ICONS: Record<string, string> = {
  nfc: 'fa-wifi',
  grid: 'fa-table-columns',
  wallet: 'fa-wallet',
  camera: 'fa-camera',
  users: 'fa-users',
  globe: 'fa-globe',
  calendar: 'fa-calendar-days',
  shirt: 'fa-shirt',
  activity: 'fa-arrow-trend-up',
  star: 'fa-star',
  bolt: 'fa-bolt',
  layers: 'fa-layer-group',
  chart: 'fa-chart-line',
  book: 'fa-book',
}

export function AppIcon({ icon }: { icon: string }) {
  return <i className={`fa-solid ${ICONS[icon] ?? ICONS.grid}`} />
}

export function AppsGrid({ apps, admin = false }: { apps: AppPublic[]; admin?: boolean }) {
  const [cat, setCat] = useState('All')
  const [dept, setDept] = useState('all')
  const [manageOpen, setManageOpen] = useState(false)

  const filtered = apps.filter((a) => {
    const matchCat = cat === 'All' || a.category === cat
    const matchDept = dept === 'all' || a.dept === dept
    return matchCat && matchDept
  })

  return (
    <>
      <div className="filter-bar">
        <div className="chip-row">
          {['All', 'Internal', 'Public'].map((c) => (
            <button
              key={c}
              className={`chip ${cat === c ? 'is-active' : ''}`}
              onClick={() => setCat(c)}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="chip-row">
          {[{ key: 'all', short: 'All departments' }, ...DEPARTMENTS].map((d) => (
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" id="mu-app-grid">
        {filtered.map((app) => {
          const deptInfo = DEPARTMENTS.find((d) => d.key === app.dept)
          const href = app.url && app.url.startsWith('http') ? app.url : '#'
          return (
            <a
              key={app.app_id}
              href={href}
              target={href !== '#' ? '_blank' : undefined}
              rel="noreferrer"
              className="app-card"
              data-dept={app.dept ?? ''}
              style={{ cursor: href !== '#' ? 'pointer' : 'default' }}
            >
              <div className="app-card__icon">
                <AppIcon icon={app.icon} />
              </div>
              <div>
                <div className="app-card__title">{app.name}</div>
                {app.desc && <p className="app-card__desc">{app.desc}</p>}
              </div>
              <div className="app-card__footer">
                {deptInfo ? (
                  <span className="dept-tag" data-dept={app.dept}>
                    {deptInfo.short}
                  </span>
                ) : (
                  <span />
                )}
                <span
                  className={`app-card__badge ${app.category === 'Public' ? 'is-public' : ''}`}
                >
                  {app.category}
                </span>
              </div>
            </a>
          )
        })}
      </div>
      {!filtered.length && <p className="text-faint mt-8">No apps match that filter.</p>}

      {admin && (
        <div className="mt-6">
          <button className="btn btn-ghost btn-sm" onClick={() => setManageOpen(true)}>
            <i className="fa-solid fa-gear" />
            Manage apps
          </button>
        </div>
      )}

      {manageOpen && <AppsManageModal apps={apps} onClose={() => setManageOpen(false)} />}
    </>
  )
}

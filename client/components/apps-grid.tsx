'use client'

import { useState } from 'react'
import { AppsManageModal } from '@/components/apps-manage-modal'
import { AppIcon } from '@/components/icon-picker'
import type { AppPublic } from '@/lib/types'

export { AppIcon }

export function AppsGrid({ apps, admin = false }: { apps: AppPublic[]; admin?: boolean }) {
  const [manageOpen, setManageOpen] = useState(false)

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" id="mu-app-grid">
        {apps.map((app) => {
          const href = app.url && app.url.startsWith('http') ? app.url : '#'
          return (
            <a
              key={app.app_id}
              href={href}
              target={href !== '#' ? '_blank' : undefined}
              rel="noreferrer"
              className="app-card"
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
                <span className="app-card__badge">Internal</span>
                {app.staff_only && (
                  <span className="app-card__badge">Staff only</span>
                )}
              </div>
            </a>
          )
        })}
      </div>
      {!apps.length && <p className="text-faint mt-8">No apps yet — add the first one below.</p>}

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

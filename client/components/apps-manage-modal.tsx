'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { AppIcon } from '@/components/apps-grid'
import { DEPARTMENTS, type AppPublic } from '@/lib/types'

const EMPTY = {
  app_id: '',
  name: '',
  desc: '',
  category: 'Internal',
  dept: '',
  icon: 'grid',
  url: '',
  enabled: true,
}

const ICON_OPTIONS = ['grid', 'globe', 'camera', 'users', 'wallet', 'calendar', 'shirt', 'activity', 'nfc', 'star', 'bolt', 'layers', 'chart', 'book']

export function AppsManageModal({
  apps,
  onClose,
}: {
  apps: AppPublic[]
  onClose: () => void
}) {
  const router = useRouter()
  const [editing, setEditing] = useState<typeof EMPTY | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function save(data: typeof EMPTY) {
    setBusy(true)
    setError('')
    const editingId = editing?.app_id
    const res = await fetch(
      editingId
        ? `/api/apps/manage/${encodeURIComponent(editingId)}`
        : '/api/apps/manage',
      {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          dept: data.dept || null,
          desc: data.desc || null,
          url: data.url || null,
        }),
      }
    )
    const json = await res.json()
    setBusy(false)
    if (!res.ok) {
      setError(json?.error ?? 'Save failed')
      return
    }
    setEditing(null)
    router.refresh()
  }

  async function toggle(app: AppPublic) {
    const res = await fetch(`/api/apps/manage/${encodeURIComponent(app.app_id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: !app.enabled }),
    })
    const json = await res.json()
    if (!res.ok) {
      setError(json?.error ?? 'Toggle failed')
      return
    }
    router.refresh()
  }

  async function remove(app: AppPublic) {
    if (!confirm(`Delete "${app.name}" from the directory?`)) return
    const res = await fetch(`/api/apps/manage/${encodeURIComponent(app.app_id)}`, {
      method: 'DELETE',
    })
    const json = await res.json()
    if (!res.ok) {
      setError(json?.error ?? 'Delete failed')
      return
    }
    router.refresh()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__head">
          <h2 className="h-md">Manage apps</h2>
          <button className="modal__close" onClick={onClose} aria-label="Close">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
        <div className="modal__body">
          {error && <p className="auth-error mb-4">{error}</p>}

          {editing ? (
            <>
              <h3 className="h-md mb-4">Edit app</h3>
              <AppForm
                initial={editing}
                submitLabel={busy ? 'Saving…' : 'Save changes'}
                onSubmit={save}
                onCancel={() => setEditing(null)}
              />
            </>
          ) : (
            <>
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>App</th>
                      <th>Category</th>
                      <th>Dept</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apps.map((app) => (
                      <tr key={app.app_id}>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="app-card__icon" style={{ width: 34, height: 34, borderRadius: 9 }}>
                              <AppIcon icon={app.icon} />
                            </div>
                            <div>
                              <div style={{ fontWeight: 700 }}>{app.name}</div>
                              <div className="font-mono text-faint" style={{ fontSize: '0.7rem' }}>
                                {app.app_id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`app-card__badge ${app.category === 'Public' ? 'is-public' : ''}`}>
                            {app.category}
                          </span>
                        </td>
                        <td>
                          {app.dept ? (
                            <span className="dept-tag" data-dept={app.dept}>
                              {DEPARTMENTS.find((d) => d.key === app.dept)?.short ?? app.dept}
                            </span>
                          ) : (
                            <span className="text-faint">—</span>
                          )}
                        </td>
                        <td>
                          <span className={`status-pill ${app.enabled ? 'active' : 'unassigned'}`}>
                            {app.enabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </td>
                        <td>
                          <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => setEditing({ ...EMPTY, ...app, dept: app.dept ?? '', desc: app.desc ?? '', url: app.url ?? '' })}
                            >
                              Edit
                            </button>
                            <button className="btn btn-ghost btn-sm" onClick={() => toggle(app)}>
                              {app.enabled ? 'Disable' : 'Enable'}
                            </button>
                            <button className="btn btn-ghost btn-sm" onClick={() => remove(app)} style={{ color: 'var(--coral)' }}>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {!apps.length && (
                <p className="text-faint mt-4">No apps yet — add your first app below.</p>
              )}

              <div className="mt-6">
                <h3 className="h-md mb-4">Add an app</h3>
                <AppForm
                  initial={EMPTY}
                  submitLabel={busy ? 'Saving…' : '+ Add app'}
                  onSubmit={save}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function AppForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial: typeof EMPTY
  submitLabel: string
  onSubmit: (data: typeof EMPTY) => Promise<void>
  onCancel?: () => void
}) {
  const [form, setForm] = useState(initial)
  const [error, setError] = useState('')

  const set = (key: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [key]: e.target.value })

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      await onSubmit(form)
    } catch (err) {
      setError((err as Error).message || 'Save failed')
    }
  }

  return (
    <form className="assign-form" onSubmit={submit}>
      <input placeholder="app_id (unique)" value={form.app_id} onChange={set('app_id')} required disabled={!!initial.app_id} />
      <input placeholder="Name" value={form.name} onChange={set('name')} required />
      <input className="form-full" placeholder="Description" value={form.desc} onChange={set('desc')} />
      <input className="form-full" placeholder="https://app-url" value={form.url} onChange={set('url')} />
      <select value={form.category} onChange={set('category')}>
        <option value="Internal">Internal</option>
        <option value="Public">Public</option>
      </select>
      <select value={form.dept} onChange={set('dept')}>
        <option value="">— No dept —</option>
        {DEPARTMENTS.map((d) => (
          <option key={d.key} value={d.key}>{d.short}</option>
        ))}
      </select>
      <select value={form.icon} onChange={set('icon')}>
        {ICON_OPTIONS.map((i) => (
          <option key={i} value={i}>{i}</option>
        ))}
      </select>
      <label className="flex items-center gap-2" style={{ fontSize: '0.8rem', alignItems: 'center' }}>
        <input
          type="checkbox"
          checked={form.enabled}
          onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
          style={{ width: 'auto', minWidth: 0 }}
        />
        Enabled
      </label>
      <div className="form-actions">
        <button className="btn btn-primary btn-sm" type="submit">{submitLabel}</button>
        {onCancel && (
          <button className="btn btn-ghost btn-sm" type="button" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
      {error && <span className="auth-error form-full">{error}</span>}
    </form>
  )
}

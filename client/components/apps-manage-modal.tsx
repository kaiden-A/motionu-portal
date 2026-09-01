'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { AppIcon, IconPicker } from '@/components/icon-picker'
import type { AppPublic } from '@/lib/types'

const EMPTY = {
  name: '',
  desc: '',
  icon: 'grid',
  url: '',
  enabled: true,
}

type AppFormState = typeof EMPTY & { app_id?: string }

export function AppsManageModal({
  apps,
  onClose,
}: {
  apps: AppPublic[]
  onClose: () => void
}) {
  const router = useRouter()
  const [editing, setEditing] = useState<AppFormState | null>(null)
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
                              {app.url && (
                                <div className="font-mono text-faint" style={{ fontSize: '0.7rem' }}>
                                  {app.url}
                                </div>
                              )}
                            </div>
                          </div>
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
                              onClick={() => setEditing({ ...EMPTY, ...app, desc: app.desc ?? '', url: app.url ?? '' })}
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
  initial: AppFormState
  submitLabel: string
  onSubmit: (data: AppFormState) => Promise<void>
  onCancel?: () => void
}) {
  const [form, setForm] = useState(initial)

  const set = (key: keyof AppFormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [key]: e.target.value })

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    try {
      await onSubmit(form)
    } catch {
      /* errors surface in the parent's banner */
    }
  }

  return (
    <form className="assign-form" onSubmit={submit}>
      <input className="form-full" placeholder="Name" value={form.name} onChange={set('name')} required />
      <input className="form-full" placeholder="Description" value={form.desc} onChange={set('desc')} />
      <input className="form-full" placeholder="https://app-url" value={form.url} onChange={set('url')} />
      <div className="form-full">
        <span className="font-mono text-faint" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>
          Icon
        </span>
        <div className="mt-2">
          <IconPicker value={form.icon} onChange={(icon) => setForm({ ...form, icon })} />
        </div>
      </div>
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
    </form>
  )
}

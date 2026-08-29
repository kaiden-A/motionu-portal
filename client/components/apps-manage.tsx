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

function Form({
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
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const set = (key: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [key]: e.target.value })

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await onSubmit(form)
      onCancel?.()
    } catch (err) {
      setError((err as Error).message || 'Save failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="assign-form" onSubmit={submit} style={{ alignItems: 'flex-start' }}>
      <input placeholder="app_id (unique)" value={form.app_id} onChange={set('app_id')} required style={{ minWidth: 160 }} disabled={!!initial.app_id} />
      <input placeholder="Name" value={form.name} onChange={set('name')} required style={{ minWidth: 160 }} />
      <input placeholder="Description" value={form.desc} onChange={set('desc')} style={{ minWidth: 200 }} />
      <input placeholder="https://app-url" value={form.url} onChange={set('url')} style={{ minWidth: 200 }} />
      <select value={form.category} onChange={set('category')}>
        <option value="Internal">Internal</option>
        <option value="Public">Public</option>
      </select>
      <select value={form.dept ?? ''} onChange={set('dept')}>
        <option value="">— No dept —</option>
        {DEPARTMENTS.map((d) => (
          <option key={d.key} value={d.key}>{d.short}</option>
        ))}
      </select>
      <select value={form.icon} onChange={set('icon')}>
        {['grid', 'globe', 'camera', 'users', 'wallet', 'calendar', 'shirt', 'activity', 'nfc', 'star', 'bolt', 'layers', 'chart', 'book'].map((i) => (
          <option key={i} value={i}>{i}</option>
        ))}
      </select>
      <label className="flex items-center gap-8" style={{ fontSize: '0.8rem' }}>
        <input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} />
        Enabled
      </label>
      <button className="btn btn-primary btn-sm" disabled={busy} type="submit">
        {busy ? 'Saving…' : submitLabel}
      </button>
      {onCancel && (
        <button className="btn btn-ghost btn-sm" type="button" onClick={onCancel}>
          Cancel
        </button>
      )}
      {error && <span className="auth-error">{error}</span>}
    </form>
  )
}

export function AppsManage({ apps }: { apps: AppPublic[] }) {
  const router = useRouter()
  const [editing, setEditing] = useState<typeof EMPTY | null>(null)
  const [error, setError] = useState('')

  async function create(data: typeof EMPTY) {
    const res = await fetch('/api/apps/manage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json?.error ?? 'Create failed')
    setEditing(null)
    router.refresh()
  }

  async function update(data: typeof EMPTY) {
    const res = await fetch(`/api/apps/manage/${encodeURIComponent(data.app_id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: data.name,
        desc: data.desc,
        category: data.category,
        dept: data.dept || null,
        icon: data.icon,
        url: data.url,
        enabled: data.enabled,
      }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json?.error ?? 'Update failed')
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
    <div>
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
                  <div className="flex items-center gap-8">
                    <div className="app-card__icon" style={{ width: 34, height: 34, borderRadius: 9 }}>
                      <AppIcon icon={app.icon} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700 }}>{app.name}</div>
                      <div className="mono text-faint" style={{ fontSize: '0.7rem' }}>
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
                  <div className="flex gap-8">
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditing({ ...EMPTY, ...app, dept: app.dept ?? '', desc: app.desc ?? '', url: app.url ?? '' })}>
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

      <div className="mt-24">
        {error && <p className="auth-error">{error}</p>}
        {editing ? (
          <>
            <h3 className="h-md mb-16">Edit app</h3>
            <Form
              initial={editing}
              submitLabel="Save changes"
              onSubmit={update}
              onCancel={() => setEditing(null)}
            />
          </>
        ) : (
          <>
            <h3 className="h-md mb-16">Add an app</h3>
            <Form
              initial={EMPTY}
              submitLabel="+ Add app"
              onSubmit={create}
            />
          </>
        )}
      </div>
    </div>
  )
}

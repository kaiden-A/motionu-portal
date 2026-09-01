'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { DEPARTMENTS, type NewsItem, type PortalEvent } from '@/lib/types'

type Tab = 'news' | 'events'

export function NewsAdminModal({
  news,
  events,
}: {
  news: NewsItem[]
  events: PortalEvent[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<Tab>('news')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function mutate(path: string, method: string, body?: unknown) {
    setBusy(true)
    setError('')
    const res = await fetch(path, {
      method,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
    const json = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) {
      setError((json as { error?: string })?.error ?? 'Request failed')
      return false
    }
    router.refresh()
    return true
  }

  return (
    <>
      <button className="btn btn-primary" onClick={() => setOpen(true)}>
        <i className="fa-solid fa-pen-to-square" />
        Manage news &amp; events
      </button>

      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal modal--wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal__head">
              <h2 className="h-md">Manage news &amp; events</h2>
              <button className="modal__close" onClick={() => setOpen(false)} aria-label="Close">
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <div className="modal__body">
              {error && <p className="auth-error mb-4">{error}</p>}

              <div className="chip-row" style={{ marginBottom: 20 }}>
                <button className={`chip ${tab === 'news' ? 'is-active' : ''}`} onClick={() => setTab('news')}>
                  News
                </button>
                <button className={`chip ${tab === 'events' ? 'is-active' : ''}`} onClick={() => setTab('events')}>
                  Events
                </button>
              </div>

              {tab === 'news' ? (
                <NewsManager news={news} mutate={mutate} busy={busy} />
              ) : (
                <EventsManager events={events} mutate={mutate} busy={busy} />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function NewsManager({
  news,
  mutate,
  busy,
}: {
  news: NewsItem[]
  mutate: (path: string, method: string, body?: unknown) => Promise<boolean>
  busy: boolean
}) {
  const [editing, setEditing] = useState<NewsItem | null>(null)
  const [form, setForm] = useState({ title: '', body: '', dept: '', pinned: false })

  async function save(e: React.FormEvent) {
    e.preventDefault()
    const payload = {
      title: form.title,
      body: form.body,
      dept: form.dept || null,
      pinned: form.pinned,
    }
    const ok = await mutate(
      editing ? `/api/news/${editing.id}` : '/api/news',
      editing ? 'PATCH' : 'POST',
      payload
    )
    if (ok) {
      setEditing(null)
      setForm({ title: '', body: '', dept: '', pinned: false })
    }
  }

  return (
    <>
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Date</th>
              <th>Dept</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {news.map((n) => (
              <tr key={n.id}>
                <td>
                  <div style={{ fontWeight: 700 }}>
                    {n.pinned && <span className="status-pill active" style={{ marginRight: 6 }}>Pinned</span>}
                    {n.title}
                  </div>
                </td>
                <td className="font-mono text-faint" style={{ fontSize: '0.75rem' }}>
                  {new Date(n.published_at).toLocaleDateString()}
                </td>
                <td>{n.dept ? <span className="dept-tag" data-dept={n.dept}>{DEPARTMENTS.find((d) => d.key === n.dept)?.short ?? n.dept}</span> : <span className="text-faint">—</span>}</td>
                <td>
                  <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                    <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => {
                      setEditing(n)
                      setForm({ title: n.title, body: n.body, dept: n.dept ?? '', pinned: n.pinned })
                    }}>
                      Edit
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      disabled={busy}
                      onClick={() => mutate(`/api/news/${n.id}`, 'PATCH', { pinned: !n.pinned })}
                    >
                      {n.pinned ? 'Unpin' : 'Pin'}
                    </button>
                    <button className="btn btn-ghost btn-sm" disabled={busy} style={{ color: 'var(--coral)' }} onClick={() => mutate(`/api/news/${n.id}`, 'DELETE')}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!news.length && <p className="text-faint mt-4">No news yet.</p>}

      <form className="assign-form mt-6" onSubmit={save}>
        <h3 className="h-md mb-2">{editing ? 'Edit news' : 'Post news'}</h3>
        <input className="form-full" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <textarea className="form-full" placeholder="Body" rows={5} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required />
        <select value={form.dept} onChange={(e) => setForm({ ...form, dept: e.target.value })}>
          <option value="">— No department —</option>
          {DEPARTMENTS.map((d) => (
            <option key={d.key} value={d.key}>{d.short}</option>
          ))}
        </select>
        <label className="flex items-center gap-2" style={{ fontSize: '0.8rem', alignItems: 'center' }}>
          <input type="checkbox" checked={form.pinned} onChange={(e) => setForm({ ...form, pinned: e.target.checked })} style={{ width: 'auto', minWidth: 0 }} />
          Pin to top
        </label>
        <div className="form-actions">
          <button className="btn btn-primary btn-sm" type="submit" disabled={busy}>
            {busy ? <span className="spinner" /> : null}
            {busy ? 'Saving…' : editing ? 'Save changes' : 'Publish'}
          </button>
          {editing && (
            <button className="btn btn-ghost btn-sm" type="button" onClick={() => setEditing(null)}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </>
  )
}

function EventsManager({
  events,
  mutate,
  busy,
}: {
  events: PortalEvent[]
  mutate: (path: string, method: string, body?: unknown) => Promise<boolean>
  busy: boolean
}) {
  const [editing, setEditing] = useState<PortalEvent | null>(null)
  const [form, setForm] = useState({
    title: '',
    description: '',
    location: '',
    starts_at: '',
    ends_at: '',
    dept: '',
  })

  function toLocalInput(iso: string) {
    const d = new Date(iso)
    const pad = (x: number) => String(x).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    const payload = {
      title: form.title,
      description: form.description || null,
      location: form.location || null,
      starts_at: new Date(form.starts_at).toISOString(),
      ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
      dept: form.dept || null,
    }
    const ok = await mutate(
      editing ? `/api/events/${editing.id}` : '/api/events',
      editing ? 'PATCH' : 'POST',
      payload
    )
    if (ok) {
      setEditing(null)
      setForm({ title: '', description: '', location: '', starts_at: '', ends_at: '', dept: '' })
    }
  }

  return (
    <>
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Starts</th>
              <th>Location</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id}>
                <td style={{ fontWeight: 700 }}>{e.title}</td>
                <td className="font-mono text-faint" style={{ fontSize: '0.75rem' }}>
                  {new Date(e.starts_at).toLocaleString()}
                </td>
                <td>{e.location ?? <span className="text-faint">—</span>}</td>
                <td>
                  <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                    <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => {
                      setEditing(e)
                      setForm({
                        title: e.title,
                        description: e.description ?? '',
                        location: e.location ?? '',
                        starts_at: toLocalInput(e.starts_at),
                        ends_at: e.ends_at ? toLocalInput(e.ends_at) : '',
                        dept: e.dept ?? '',
                      })
                    }}>
                      Edit
                    </button>
                    <button className="btn btn-ghost btn-sm" disabled={busy} style={{ color: 'var(--coral)' }} onClick={() => mutate(`/api/events/${e.id}`, 'DELETE')}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!events.length && <p className="text-faint mt-4">No events yet.</p>}

      <form className="assign-form mt-6" onSubmit={save}>
        <h3 className="h-md mb-2">{editing ? 'Edit event' : 'Add event'}</h3>
        <input className="form-full" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <input className="form-full" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <input className="form-full" placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
        <input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} required />
        <input type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} />
        <select value={form.dept} onChange={(e) => setForm({ ...form, dept: e.target.value })}>
          <option value="">— No department —</option>
          {DEPARTMENTS.map((d) => (
            <option key={d.key} value={d.key}>{d.short}</option>
          ))}
        </select>
        <div className="form-actions">
          <button className="btn btn-primary btn-sm" type="submit" disabled={busy}>
            {busy ? <span className="spinner" /> : null}
            {busy ? 'Saving…' : editing ? 'Save changes' : '+ Add event'}
          </button>
          {editing && (
            <button className="btn btn-ghost btn-sm" type="button" onClick={() => setEditing(null)}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </>
  )
}

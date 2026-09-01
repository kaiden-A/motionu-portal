'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { SuspendModal } from '@/components/suspend-modal'
import { ROLE_KEYS, ROLE_SHORT, type PortalUser } from '@/lib/types'

let editRequestor: ((user: PortalUser) => void) | null = null

async function post(path: string, method: string, body?: unknown) {
  const res = await fetch(path, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) return { error: (json as { error?: string })?.error ?? 'Request failed' }
  return { data: json }
}

function RolePicker({
  selected,
  onChange,
}: {
  selected: string[]
  onChange: (next: string[]) => void
}) {
  return (
    <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
      {ROLE_KEYS.map((r) => (
        <label
          key={r}
          className="chip"
          style={{ cursor: 'pointer', userSelect: 'none' }}
        >
          <input
            type="checkbox"
            checked={selected.includes(r)}
            style={{ marginRight: 5, width: 'auto', minWidth: 0 }}
            onChange={(e) =>
              onChange(
                e.target.checked
                  ? [...selected, r]
                  : selected.filter((x) => x !== r)
              )
            }
          />
          {ROLE_SHORT[r] ?? r}
        </label>
      ))}
    </div>
  )
}

export function UsersManageModal({ users }: { users: PortalUser[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<PortalUser | null>(null)
  const [form, setForm] = useState({ name: '', email: '', roles: ['member'] })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  function startAdd() {
    setEditing(null)
    setForm({ name: '', email: '', roles: ['member'] })
    setError('')
  }

  function startEdit(u: PortalUser) {
    setEditing(u)
    setForm({ name: u.name, email: u.email, roles: [...(u.roles || [])] })
    setError('')
  }

  useEffect(() => {
    editRequestor = (u: PortalUser) => {
      startEdit(u)
      setOpen(true)
    }
    return () => {
      editRequestor = null
    }
  }, [])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const { data, error: err } = await post(
      editing ? `/api/users/${editing.id}` : '/api/users',
      editing ? 'PATCH' : 'POST',
      { name: form.name, email: form.email, roles: form.roles }
    )
    setBusy(false)
    if (err) {
      setError(err)
      return
    }
    router.refresh()
    setOpen(false)
  }

  return (
    <>
      <button className="btn btn-primary" onClick={() => { startAdd(); setOpen(true) }}>
        <i className="fa-solid fa-user-plus" />
        Add user
      </button>

      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__head">
              <h2 className="h-md">{editing ? 'Edit user' : 'Add user'}</h2>
              <button className="modal__close" onClick={() => setOpen(false)} aria-label="Close">
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <div className="modal__body">
              {error && <p className="auth-error mb-4">{error}</p>}
              <form className="assign-form" onSubmit={save}>
                <input placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                <div className="form-full">
                  <span className="font-mono text-faint" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>
                    Roles
                  </span>
                  <div className="mt-2">
                    <RolePicker selected={form.roles} onChange={(roles) => setForm({ ...form, roles })} />
                  </div>
                </div>
                <div className="form-actions">
                  <button className="btn btn-primary btn-sm" type="submit" disabled={busy}>
                    {busy ? 'Saving…' : editing ? 'Save changes' : 'Create user'}
                  </button>
                  {editing && (
                    <button className="btn btn-ghost btn-sm" type="button" onClick={startAdd}>
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              {editing && (
                <p className="text-faint mt-4" style={{ fontSize: '0.78rem' }}>
                  Changes are written to Zitadel and mirrored to the portal. The card
                  assignment is untouched.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function RowActions({ user }: { user: PortalUser }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [suspendTarget, setSuspendTarget] = useState<PortalUser | null>(null)

  async function reactivate() {
    setBusy(true)
    setError('')
    const { error: err } = await post(`/api/users/${user.id}/reactivate`, 'POST')
    setBusy(false)
    if (err) {
      setError(err)
      return
    }
    router.refresh()
  }

  return (
    <>
      {error && <span className="auth-error" style={{ marginRight: 8 }}>{error}</span>}
      <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => editRequestor?.(user)}>
        Edit
      </button>
      {user.active ? (
        <button
          className="btn btn-ghost btn-sm"
          disabled={busy}
          style={{ color: 'var(--coral)' }}
          onClick={() => setSuspendTarget(user)}
        >
          Suspend
        </button>
      ) : (
        <button className="btn btn-ghost btn-sm" disabled={busy} onClick={reactivate}>
          Reactivate
        </button>
      )}
      {suspendTarget && (
        <SuspendModal user={suspendTarget} onClose={() => setSuspendTarget(null)} />
      )}
    </>
  )
}

export const UserRowActions = RowActions

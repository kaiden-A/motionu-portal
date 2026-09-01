'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { AppIcon, IconPicker } from '@/components/icon-picker'
import type { Achievement, MemberDirectoryItem } from '@/lib/types'

export function AchievementsAdmin({
  badges,
  members,
}: {
  badges: Achievement[]
  members: MemberDirectoryItem[]
}) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<Achievement | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState({ label: '', desc: '', icon: 'star' })
  const [busy, setBusy] = useState(false)

  // Assignment state
  const [selectedSub, setSelectedSub] = useState('')
  const [selectedKeys, setSelectedKeys] = useState<string[]>([])

  const selectedMember = members.find((m) => m.zitadel_sub === selectedSub)

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

  function openCreate() {
    setEditing(null)
    setForm({ label: '', desc: '', icon: 'star' })
    setError('')
    setFormOpen(true)
  }

  function openEdit(b: Achievement) {
    setEditing(b)
    setForm({ label: b.label, desc: b.desc ?? '', icon: b.icon })
    setError('')
    setFormOpen(true)
  }

  async function saveBadge(e: React.FormEvent) {
    e.preventDefault()
    const ok = await mutate(
      editing ? `/api/achievements/${editing.key}` : '/api/achievements',
      editing ? 'PATCH' : 'POST',
      { label: form.label, desc: form.desc || null, icon: form.icon }
    )
    if (ok) setFormOpen(false)
  }

  function pickMember(sub: string) {
    setSelectedSub(sub)
    const m = members.find((x) => x.zitadel_sub === sub)
    setSelectedKeys([...(m?.achievements ?? [])])
  }

  async function saveAssignments() {
    if (!selectedSub) return
    const ok = await mutate(`/api/achievements/members/${encodeURIComponent(selectedSub)}`, 'PATCH', {
      keys: selectedKeys,
    })
    if (ok) setSelectedSub('')
  }

  async function revokeSelected() {
    if (!selectedSub || !selectedKeys.length) return
    const ok = await mutate(
      `/api/achievements/members/${encodeURIComponent(selectedSub)}/revoke`,
      'POST',
      { keys: selectedKeys }
    )
    if (ok) {
      const m = members.find((x) => x.zitadel_sub === selectedSub)
      setSelectedKeys([...(m?.achievements ?? [])])
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5" style={{ alignItems: 'start' }}>
      <section className="panel">
        <div className="flex items-center justify-between gap-3" style={{ flexWrap: 'wrap' }}>
          <span className="eyebrow">Badge catalog</span>
          <button className="btn btn-primary btn-sm" onClick={openCreate}>
            <i className="fa-solid fa-plus" />
            Create badge
          </button>
        </div>

        <div className="mt-4" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {badges.map((b) => (
            <div key={b.key} className="flex items-center justify-between gap-3" style={{ paddingBottom: 12, borderBottom: '1px solid var(--color-line)' }}>
              <div className="flex items-center gap-3">
                <div className="app-card__icon" style={{ width: 40, height: 40, borderRadius: 10 }}>
                  <AppIcon icon={b.icon} />
                </div>
                <div>
                  <div style={{ fontWeight: 700 }}>{b.label}</div>
                  {b.desc && <div className="text-faint" style={{ fontSize: '0.8rem' }}>{b.desc}</div>}
                </div>
              </div>
              <div className="flex gap-2" style={{ flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <span className={`status-pill ${b.enabled ? 'active' : 'unassigned'}`}>
                  {b.enabled ? 'Active' : 'Disabled'}
                </span>
                <button
                  className="btn btn-ghost btn-sm"
                  disabled={busy}
                  onClick={() => mutate(`/api/achievements/${b.key}`, 'PATCH', { enabled: !b.enabled })}
                >
                  {b.enabled ? 'Disable' : 'Enable'}
                </button>
                <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => openEdit(b)}>
                  Edit
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  disabled={busy}
                  style={{ color: 'var(--coral)' }}
                  onClick={() => mutate(`/api/achievements/${b.key}`, 'DELETE')}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {!badges.length && (
            <p className="text-faint">
              No badges yet.{' '}
              <button className="btn btn-ghost btn-sm" onClick={openCreate}>
                Create the first badge
              </button>
            </p>
          )}
        </div>
      </section>

      <section className="panel">
        <span className="eyebrow">Assign badges</span>
        <p className="text-dim mt-2" style={{ fontSize: '0.85rem', lineHeight: 1.5 }}>
          Pick a member, tick the badges they earned, and save — their profile and the
          directory update instantly.
        </p>

        {error && <p className="auth-error mt-3">{error}</p>}

        <div className="assign-form mt-4">
          <select className="form-full" value={selectedSub} onChange={(e) => pickMember(e.target.value)}>
            <option value="">— Choose a member —</option>
            {members.map((m) => (
              <option key={m.zitadel_sub ?? m.name} value={m.zitadel_sub ?? ''}>{m.name}</option>
            ))}
          </select>
        </div>

        {selectedMember ? (
          <>
            <div className="mt-4 flex items-center gap-2">
              <div className="mini-avatar" data-dept={selectedMember.dept ?? ''}>
                {selectedMember.initials}
              </div>
              <span style={{ fontWeight: 700 }}>{selectedMember.name}</span>
            </div>

            <div className="mt-4" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {badges.map((b) => (
                <label
                  key={b.key}
                  className={`flex items-center gap-3 chip ${selectedKeys.includes(b.key) ? 'is-active' : ''}`}
                  style={{ cursor: 'pointer', padding: '8px 12px', width: '100%' }}
                >
                  <input
                    type="checkbox"
                    checked={selectedKeys.includes(b.key)}
                    disabled={!b.enabled}
                    style={{ width: 'auto', minWidth: 0 }}
                    onChange={(e) =>
                      setSelectedKeys(
                        e.target.checked
                          ? [...selectedKeys, b.key]
                          : selectedKeys.filter((k) => k !== b.key)
                      )
                    }
                  />
                  <AppIcon icon={b.icon} />
                  <span>{b.label}</span>
                  {!b.enabled && <span className="text-faint" style={{ fontSize: '0.72rem' }}>disabled</span>}
                </label>
              ))}
              {!badges.length && <p className="text-faint">Create badges first to assign them.</p>}
            </div>

            <div className="form-actions mt-5">
              <button className="btn btn-primary btn-sm" onClick={saveAssignments} disabled={busy}>
                {busy ? <span className="spinner" /> : null}
                {busy ? 'Saving…' : 'Save assignments'}
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={revokeSelected}
                disabled={busy || !selectedKeys.length}
                style={{ color: 'var(--coral)' }}
              >
                {busy ? <span className="spinner" /> : null}
                Remove checked
              </button>
            </div>
          </>
        ) : (
          !error && <p className="text-faint mt-4" style={{ fontSize: '0.82rem' }}>Select a member above to manage their badges.</p>
        )}
      </section>

      {formOpen && (
        <div className="modal-overlay" onClick={() => setFormOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__head">
              <h2 className="h-md">{editing ? 'Edit badge' : 'Create badge'}</h2>
              <button className="modal__close" onClick={() => setFormOpen(false)} aria-label="Close">
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <div className="modal__body">
              {error && <p className="auth-error mb-4">{error}</p>}
              <form className="assign-form" onSubmit={saveBadge}>
                <input
                  className="form-full"
                  placeholder="Badge name (e.g. 5KM Finisher)"
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  required
                />
                <input
                  className="form-full"
                  placeholder="Description"
                  value={form.desc}
                  onChange={(e) => setForm({ ...form, desc: e.target.value })}
                />
                <div className="form-full">
                  <span className="font-mono text-faint" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>
                    Icon
                  </span>
                  <div className="mt-2">
                    <IconPicker value={form.icon} onChange={(icon) => setForm({ ...form, icon })} />
                  </div>
                </div>
                <div className="form-actions">
                  <button className="btn btn-primary btn-sm" type="submit" disabled={busy}>
                    {busy ? <span className="spinner" /> : null}
                    {busy ? 'Saving…' : editing ? 'Save changes' : '+ Create badge'}
                  </button>
                  <button className="btn btn-ghost btn-sm" type="button" onClick={() => setFormOpen(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

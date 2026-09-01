'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { MembershipAdmin, MembershipPlan } from '@/lib/types'

const STATUSES = ['pending', 'active', 'expired', 'cancelled'] as const

export function MembershipEditModal({
  membership,
  plans,
  onClose,
}: {
  membership: MembershipAdmin
  plans: MembershipPlan[]
  onClose: () => void
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    plan_key: membership.plan_key ?? '',
    status: membership.status,
    starts_at: membership.starts_at ? membership.starts_at.slice(0, 16) : '',
    ends_at: membership.ends_at ? membership.ends_at.slice(0, 16) : '',
    auto_renew: membership.auto_renew,
    notes: membership.notes ?? '',
  })

  const set = (key: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm({ ...form, [key]: e.target.value })

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const res = await fetch(`/api/memberships/${membership.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_key: form.plan_key || null,
          status: form.status,
          starts_at: form.starts_at || null,
          ends_at: form.ends_at || null,
          auto_renew: form.auto_renew,
          notes: form.notes || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error ?? 'Save failed')
        return
      }
      router.refresh()
      onClose()
    } catch {
      setError('Network error — please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__head">
          <h2 className="h-md">Edit membership</h2>
          <button className="modal__close" onClick={onClose} aria-label="Close">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
        <div className="modal__body">
          <div className="mb-4">
            <div style={{ fontWeight: 700 }}>{membership.name}</div>
            <div className="uid-tag">{membership.email}</div>
          </div>
          {error && <p className="auth-error mb-4">{error}</p>}
          <form className="assign-form" onSubmit={submit}>
            <select className="form-full" value={form.plan_key} onChange={set('plan_key')}>
              <option value="">No plan</option>
              {plans.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.name}
                </option>
              ))}
            </select>
            <select className="form-full" value={form.status} onChange={set('status')}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-3">
              <input className="form-full" type="datetime-local" value={form.starts_at} onChange={set('starts_at')} />
              <input className="form-full" type="datetime-local" value={form.ends_at} onChange={set('ends_at')} />
            </div>
            <label className="flex items-center gap-2" style={{ fontSize: '0.8rem' }}>
              <input
                type="checkbox"
                checked={form.auto_renew}
                onChange={(e) => setForm({ ...form, auto_renew: e.target.checked })}
                style={{ width: 'auto', minWidth: 0 }}
              />
              Auto-renew
            </label>
            <textarea className="form-full" placeholder="Notes" rows={2} value={form.notes} onChange={set('notes')} />
            <div className="form-actions">
              <button className="btn btn-primary btn-sm" type="submit" disabled={busy}>
                {busy ? <span className="spinner" /> : null}
                {busy ? 'Saving…' : 'Save changes'}
              </button>
              <button className="btn btn-ghost btn-sm" type="button" onClick={onClose} disabled={busy}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

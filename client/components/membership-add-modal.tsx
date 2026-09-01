'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { MembershipAdmin, MembershipPlan } from '@/lib/types'

const STATUSES = ['pending', 'active', 'expired', 'cancelled'] as const

export function MembershipAddModal({
  plans,
  onClose,
}: {
  plans: MembershipPlan[]
  onClose: () => void
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    email: '',
    plan_key: '',
    status: 'active',
    starts_at: '',
    ends_at: '',
    notes: '',
  })

  const set = (key: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm({ ...form, [key]: e.target.value })

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/memberships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          plan_key: form.plan_key || null,
          status: form.status,
          starts_at: form.starts_at || null,
          ends_at: form.ends_at || null,
          auto_renew: false,
          notes: form.notes || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error ?? 'Create failed')
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
          <h2 className="h-md">Add membership holder</h2>
          <button className="modal__close" onClick={onClose} aria-label="Close">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
        <div className="modal__body">
          {error && <p className="auth-error mb-4">{error}</p>}
          <form className="assign-form" onSubmit={submit}>
            <input className="form-full" placeholder="Full name" value={form.name} onChange={set('name')} required />
            <input className="form-full" type="email" placeholder="Email (their sign-in)" value={form.email} onChange={set('email')} required />
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
            <textarea className="form-full" placeholder="Notes" rows={2} value={form.notes} onChange={set('notes')} />
            <p className="text-faint" style={{ fontSize: '0.75rem' }}>
              Creates their Zitadel sign-in and grants the membership role — the portal
              login works immediately.
            </p>
            <div className="form-actions">
              <button className="btn btn-primary btn-sm" type="submit" disabled={busy}>
                {busy ? <span className="spinner" /> : null}
                {busy ? 'Creating…' : '+ Add member'}
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

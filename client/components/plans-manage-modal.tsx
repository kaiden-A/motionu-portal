'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { MembershipPlan } from '@/lib/types'

const EMPTY = {
  name: '',
  desc: '',
  price_cents: '',
  duration_days: '',
  benefits: '',
  enabled: true,
  sort: 0,
}

type PlanFormState = typeof EMPTY & { key?: string }

function parseForm(data: PlanFormState) {
  return {
    name: data.name,
    desc: data.desc || null,
    price_cents: data.price_cents === '' ? null : Number(data.price_cents),
    duration_days: data.duration_days === '' ? null : Number(data.duration_days),
    benefits: data.benefits
      .split('\n')
      .map((b) => b.trim())
      .filter(Boolean),
    enabled: data.enabled,
    sort: Number(data.sort) || 0,
  }
}

export function PlansManageModal({
  plans,
  onClose,
}: {
  plans: MembershipPlan[]
  onClose: () => void
}) {
  const router = useRouter()
  const [editing, setEditing] = useState<PlanFormState | null>(null)
  const [busy, setBusy] = useState(false)
  const [pendingKey, setPendingKey] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function save(data: PlanFormState) {
    setBusy(true)
    setError('')
    const editingKey = editing?.key
    const res = await fetch(
      editingKey
        ? `/api/memberships/plans/${encodeURIComponent(editingKey)}`
        : '/api/memberships/plans',
      {
        method: editingKey ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parseForm(data)),
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

  async function toggle(plan: MembershipPlan) {
    setPendingKey(plan.key)
    setError('')
    try {
      const res = await fetch(`/api/memberships/plans/${encodeURIComponent(plan.key)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !plan.enabled }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json?.error ?? 'Toggle failed')
        return
      }
      router.refresh()
    } catch {
      setError('Network error — please try again.')
    } finally {
      setPendingKey(null)
    }
  }

  async function remove(plan: MembershipPlan) {
    if (!confirm(`Delete plan "${plan.name}"? Members using it must be moved first.`)) return
    setPendingKey(plan.key)
    setError('')
    try {
      const res = await fetch(`/api/memberships/plans/${encodeURIComponent(plan.key)}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json?.error ?? 'Delete failed')
        return
      }
      router.refresh()
    } catch {
      setError('Network error — please try again.')
    } finally {
      setPendingKey(null)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__head">
          <h2 className="h-md">Manage membership plans</h2>
          <button className="modal__close" onClick={onClose} aria-label="Close">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
        <div className="modal__body">
          {error && <p className="auth-error mb-4">{error}</p>}

          {editing ? (
            <>
              <h3 className="h-md mb-4">Edit plan</h3>
              <PlanForm
                initial={editing}
                busy={busy}
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
                      <th>Plan</th>
                      <th>Duration</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plans.map((plan) => (
                      <tr key={plan.key}>
                        <td>
                          <div style={{ fontWeight: 700 }}>{plan.name}</div>
                          <div className="uid-tag">{plan.benefits.length} benefits</div>
                        </td>
                        <td>{plan.duration_days ? `${plan.duration_days} days` : '—'}</td>
                        <td>
                          <span className={`status-pill ${plan.enabled ? 'active' : 'unassigned'}`}>
                            {plan.enabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </td>
                        <td>
                          <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                            <button
                              className="btn btn-ghost btn-sm"
                              disabled={pendingKey !== null}
                              onClick={() =>
                                setEditing({
                                  name: plan.name,
                                  desc: plan.desc ?? '',
                                  price_cents: plan.price_cents != null ? String(plan.price_cents) : '',
                                  duration_days: plan.duration_days != null ? String(plan.duration_days) : '',
                                  benefits: (plan.benefits ?? []).join('\n'),
                                  enabled: plan.enabled,
                                  sort: plan.sort,
                                  key: plan.key,
                                })
                              }
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-ghost btn-sm"
                              disabled={pendingKey !== null}
                              onClick={() => toggle(plan)}
                            >
                              {pendingKey === plan.key ? <span className="spinner" /> : null}
                              {plan.enabled ? 'Disable' : 'Enable'}
                            </button>
                            <button
                              className="btn btn-ghost btn-sm"
                              disabled={pendingKey !== null}
                              onClick={() => remove(plan)}
                              style={{ color: 'var(--coral)' }}
                            >
                              {pendingKey === plan.key ? <span className="spinner" /> : null}
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {!plans.length && <p className="text-faint mt-4">No plans yet — add your first plan below.</p>}

              <div className="mt-6">
                <h3 className="h-md mb-4">Add a plan</h3>
                <PlanForm
                  initial={EMPTY}
                  busy={busy}
                  submitLabel={busy ? 'Saving…' : '+ Add plan'}
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

function PlanForm({
  initial,
  submitLabel,
  busy,
  onSubmit,
  onCancel,
}: {
  initial: PlanFormState
  submitLabel: string
  busy: boolean
  onSubmit: (data: PlanFormState) => Promise<void>
  onCancel?: () => void
}) {
  const [form, setForm] = useState(initial)

  const set = (key: keyof PlanFormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm({ ...form, [key]: e.target.value })

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
      <input className="form-full" placeholder="Plan name" value={form.name} onChange={set('name')} required />
      <input className="form-full" placeholder="Description" value={form.desc} onChange={set('desc')} />
      <div className="grid grid-cols-2 gap-3">
        <input
          className="form-full"
          type="number"
          placeholder="Price (cents, optional)"
          value={form.price_cents}
          onChange={set('price_cents')}
        />
        <input
          className="form-full"
          type="number"
          placeholder="Duration (days)"
          value={form.duration_days}
          onChange={set('duration_days')}
        />
      </div>
      <textarea
        className="form-full"
        placeholder="Benefits — one per line"
        rows={4}
        value={form.benefits}
        onChange={set('benefits')}
      />
      <label className="flex items-center gap-2" style={{ fontSize: '0.8rem' }}>
        <input
          type="checkbox"
          checked={form.enabled}
          onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
          style={{ width: 'auto', minWidth: 0 }}
        />
        Enabled
      </label>
      <div className="form-actions">
        <button className="btn btn-primary btn-sm" type="submit" disabled={busy}>
          {busy ? <span className="spinner" /> : null}
          {submitLabel}
        </button>
        {onCancel && (
          <button className="btn btn-ghost btn-sm" type="button" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}

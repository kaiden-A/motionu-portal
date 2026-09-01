'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { CardAdmin, DirectoryUser } from '@/lib/types'

export function AssignSelect({
  card,
  directory,
}: {
  card: CardAdmin
  directory: DirectoryUser[]
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const currentId = card.assigned_zitadel_sub ?? ''

  async function assign(zitadelSub: string) {
    setBusy(true)
    setError('')
    try {
      const res = await fetch(`/api/cards/${encodeURIComponent(card.card_id)}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zitadel_sub: zitadelSub || null }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error ?? 'Assign failed')
        return
      }
      router.refresh()
    } catch {
      setError('Network error — please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function unlink() {
    setBusy(true)
    setError('')
    try {
      const res = await fetch(`/api/cards/${encodeURIComponent(card.card_id)}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zitadel_sub: null }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error ?? 'Unlink failed')
        return
      }
      router.refresh()
    } catch {
      setError('Network error — please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="assign-form">
      <select
        value={currentId}
        disabled={busy}
        onChange={(e) => assign(e.target.value)}
        aria-label={`Assign ${card.card_id}`}
      >
        <option value="">— Unassign —</option>
        {directory.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name} · {u.email}
          </option>
        ))}
      </select>
      {card.assigned && (
        <button
          className="btn btn-ghost btn-sm"
          onClick={unlink}
          disabled={busy}
          style={{ color: 'var(--coral)' }}
          title={`Unassign ${card.card_id}`}
        >
          {busy ? <span className="spinner" /> : <i className="fa-solid fa-link-slash" />} Unlink
        </button>
      )}
      {error && <span className="auth-error">{error}</span>}
    </div>
  )
}

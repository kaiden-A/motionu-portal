'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { CardAdmin, MembershipAdmin } from '@/lib/types'

export function MembershipCardSelect({
  membership,
  cards,
}: {
  membership: MembershipAdmin
  cards: CardAdmin[]
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const current = cards.find((c) => c.card_id === membership.card_id) ?? null
  const unassigned = cards.filter((c) => !c.assigned)

  async function assign(cardId: string) {
    setBusy(true)
    setError('')
    try {
      const res = await fetch(
        `/api/memberships/${membership.id}/assign-card`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ card_id: cardId || null }),
        }
      )
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

  return (
    <div className="assign-form">
      <select
        value={membership.card_id ?? ''}
        disabled={busy}
        onChange={(e) => assign(e.target.value)}
        aria-label={`Assign card to ${membership.name}`}
      >
        <option value="">— No card —</option>
        {current && (
          <option key={current.card_id} value={current.card_id}>
            {current.card_id} (current)
          </option>
        )}
        {unassigned.map((c) => (
          <option key={c.card_id} value={c.card_id}>
            {c.card_id}
          </option>
        ))}
      </select>
      {error && <span className="auth-error">{error}</span>}
    </div>
  )
}

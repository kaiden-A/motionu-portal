'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function ClaimButton({ cardId }: { cardId: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function claim() {
    setBusy(true)
    setError('')
    try {
      const res = await fetch(`/api/cards/${encodeURIComponent(cardId)}/claim`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error ?? 'Could not claim this card.')
        return
      }
      router.push('/profile')
      router.refresh()
    } catch {
      setError('Network error — please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <button className="btn btn-primary btn-block" onClick={claim} disabled={busy}>
        {busy ? <span className="spinner" /> : <i className="fa-solid fa-id-card" />}
        {busy ? 'Claiming…' : 'Claim this card'}
      </button>
      {error && <p className="auth-error" style={{ textAlign: 'center' }}>{error}</p>}
    </div>
  )
}

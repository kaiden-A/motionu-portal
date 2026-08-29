'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function RegisterCardForm() {
  const router = useRouter()
  const [cardId, setCardId] = useState('')
  const [uid, setUid] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ card_id: cardId.trim(), uid: uid.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error ?? 'Register failed')
        return
      }
      setCardId('')
      setUid('')
      router.refresh()
    } catch {
      setError('Network error — please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="assign-form" onSubmit={submit}>
      <input
        placeholder="CARD-011"
        value={cardId}
        onChange={(e) => setCardId(e.target.value)}
        required
        aria-label="Card ID"
        style={{ minWidth: 140 }}
      />
      <input
        placeholder="04:9C:E1:55:80:F0"
        value={uid}
        onChange={(e) => setUid(e.target.value)}
        required
        aria-label="NFC UID"
        style={{ minWidth: 200 }}
      />
      <button className="btn btn-primary btn-sm" disabled={busy} type="submit">
        {busy ? 'Registering…' : '+ Register card'}
      </button>
      {error && <span className="auth-error">{error}</span>}
    </form>
  )
}

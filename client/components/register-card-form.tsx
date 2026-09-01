'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function RegisterCardForm({ nextCardId }: { nextCardId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function confirm() {
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ card_id: nextCardId, uid: '' }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error ?? 'Register failed')
        return
      }
      setOpen(false)
      router.refresh()
    } catch {
      setError('Network error — please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button className="btn btn-primary btn-sm" onClick={() => setOpen(true)}>
        <i className="fa-solid fa-id-card" /> Register card
      </button>
      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__head">
              <h2 className="h-md">Register card</h2>
              <button className="modal__close" onClick={() => setOpen(false)} aria-label="Close">
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <div className="modal__body">
              {error && <p className="auth-error mb-4">{error}</p>}
              <p className="text-dim" style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>
                Card <strong className="font-mono">{nextCardId}</strong> will be registered in
                the portal. Are you sure?
              </p>
              <div className="form-actions mt-4">
                <button className="btn btn-primary btn-sm" onClick={confirm} disabled={busy}>
                  {busy ? <span className="spinner" /> : <i className="fa-solid fa-id-card" />}
                  {busy ? 'Registering…' : 'Yes, register card'}
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setOpen(false)}
                  disabled={busy}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

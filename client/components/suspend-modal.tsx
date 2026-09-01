'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { PortalUser } from '@/lib/types'

export function SuspendModal({
  user,
  onClose,
}: {
  user: PortalUser
  onClose: () => void
}) {
  const router = useRouter()
  const [cardId, setCardId] = useState(user.card_id ?? null)
  const [unlinking, setUnlinking] = useState(false)
  const [suspending, setSuspending] = useState(false)
  const [error, setError] = useState('')

  async function unlinkCard() {
    if (!cardId) return
    setUnlinking(true)
    setError('')
    try {
      const res = await fetch(`/api/cards/${encodeURIComponent(cardId)}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zitadel_sub: null }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error ?? 'Unlink failed')
        return
      }
      setCardId(null)
      router.refresh()
    } catch {
      setError('Network error — please try again.')
    } finally {
      setUnlinking(false)
    }
  }

  async function suspend() {
    setSuspending(true)
    setError('')
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(user.id)}/deactivate`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error ?? 'Suspend failed')
        return
      }
      router.refresh()
      onClose()
    } catch {
      setError('Network error — please try again.')
    } finally {
      setSuspending(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__head">
          <h2 className="h-md">Suspend {user.name}</h2>
          <button className="modal__close" onClick={onClose} aria-label="Close">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
        <div className="modal__body">
          {error && <p className="auth-error mb-4">{error}</p>}

          <p className="text-dim" style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>
            Suspending blocks <strong>{user.name}</strong> from signing in to every
            system that uses Motion-U login. Their portal record and history are kept.
          </p>

          <div className="panel mt-4">
            <span className="font-mono text-faint" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>
              Card assignment
            </span>
            <div className="mt-2 flex items-center gap-3" style={{ flexWrap: 'wrap' }}>
              {cardId ? (
                <>
                  <span className="font-mono uid-tag">{cardId}</span>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={unlinkCard}
                    disabled={unlinking || suspending}
                    style={{ color: 'var(--coral)' }}
                  >
                    {unlinking ? <span className="spinner" /> : null}
                    {unlinking ? 'Unlinking…' : 'Unlink card'}
                  </button>
                  <span className="text-faint" style={{ fontSize: '0.78rem' }}>
                    The card becomes unassigned and can be handed to someone else.
                  </span>
                </>
              ) : (
                <span className="text-faint">No card assigned.</span>
              )}
            </div>
          </div>

          <div className="form-actions mt-4">
            <button
              className="btn btn-primary btn-sm"
              onClick={suspend}
              disabled={suspending}
              style={{ background: 'linear-gradient(135deg, #ff5a3c, #d63b1f)' }}
            >
              {suspending ? <span className="spinner" /> : null}
              {suspending ? 'Suspending…' : 'Confirm suspend'}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={onClose} disabled={suspending}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

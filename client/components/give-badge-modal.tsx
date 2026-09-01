'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { AppIcon } from '@/components/icon-picker'
import type { Achievement, MemberDirectoryItem } from '@/lib/types'

export function GiveBadgeModal({
  member,
  badges,
  onClose,
}: {
  member: MemberDirectoryItem
  badges: Achievement[]
  onClose: () => void
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [selectedKeys, setSelectedKeys] = useState<string[]>([])

  const enabledBadges = badges.filter((b) => b.enabled)

  function toggle(key: string) {
    setSelectedKeys((keys) =>
      keys.includes(key) ? keys.filter((k) => k !== key) : [...keys, key]
    )
  }

  async function give() {
    if (!selectedKeys.length) return
    setBusy(true)
    setError('')
    try {
      const res = await fetch(
        `/api/achievements/members/${encodeURIComponent(member.zitadel_sub ?? '')}/give`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keys: selectedKeys }),
        }
      )
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error ?? 'Give failed')
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
          <h2 className="h-md">Give badges</h2>
          <button className="modal__close" onClick={onClose} aria-label="Close">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
        <div className="modal__body">
          <div className="mb-4 flex items-center gap-2">
            <div className="mini-avatar" data-dept={member.dept ?? ''}>
              {member.initials}
            </div>
            <div className="min-w-0">
              <div style={{ fontWeight: 700 }}>{member.name}</div>
              <div className="text-faint" style={{ fontSize: '0.8rem' }}>
                Badges they earn show up on their profile and in the directory.
              </div>
            </div>
          </div>

          {error && <p className="auth-error mb-4">{error}</p>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {enabledBadges.map((b) => (
              <label
                key={b.key}
                className={`flex items-center gap-3 chip ${selectedKeys.includes(b.key) ? 'is-active' : ''}`}
                style={{ cursor: 'pointer', padding: '8px 12px', width: '100%' }}
              >
                <input
                  type="checkbox"
                  checked={selectedKeys.includes(b.key)}
                  style={{ width: 'auto', minWidth: 0, flexShrink: 0 }}
                  onChange={() => toggle(b.key)}
                />
                <span style={{ flexShrink: 0, display: 'grid', placeItems: 'center' }}>
                  <AppIcon icon={b.icon} />
                </span>
                <span className="flex-1 min-w-0" style={{ display: 'flex', flexDirection: 'column', gap: 1, lineHeight: 1.35 }}>
                  <span>{b.label}</span>
                  {b.desc && <span className="text-faint" style={{ fontSize: '0.75rem' }}>{b.desc}</span>}
                </span>
              </label>
            ))}
            {!enabledBadges.length && (
              <p className="text-faint">No active badges available to give.</p>
            )}
          </div>

          <div className="form-actions mt-5">
            <button className="btn btn-primary btn-sm" onClick={give} disabled={busy || !selectedKeys.length}>
              {busy ? <span className="spinner" /> : null}
              {busy ? 'Giving…' : selectedKeys.length ? `Give ${selectedKeys.length} badge${selectedKeys.length > 1 ? 's' : ''}` : 'Select badges'}
            </button>
            <button className="btn btn-ghost btn-sm" type="button" onClick={onClose} disabled={busy}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

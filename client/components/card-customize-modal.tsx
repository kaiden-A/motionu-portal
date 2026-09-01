'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { CredentialCard } from '@/components/credential-card'
import { CARD_SKINS } from '@/lib/card-skins'
import { DEFAULT_CARD_SKIN, type Achievement, type MemberMe } from '@/lib/types'

const ACCENT_SWATCHES = [
  { value: null, label: 'Dept color' },
  { value: '#3d6bff', label: 'Royal' },
  { value: '#2b4fd6', label: 'Deep blue' },
  { value: '#ff5a3c', label: 'Coral' },
  { value: '#2dd4bf', label: 'Teal' },
  { value: '#f2c94c', label: 'Gold' },
  { value: '#a78bfa', label: 'Violet' },
  { value: '#4ade80', label: 'Green' },
  { value: '#ff5a8c', label: 'Pink' },
]

const HEX_RE = /^#[0-9a-fA-F]{6}$/

export function CardCustomizeButton({
  me,
  badges = [],
}: {
  me: MemberMe
  badges?: Achievement[]
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button className="btn btn-ghost btn-sm" onClick={() => setOpen(true)}>
        <i className="fa-solid fa-wand-magic-sparkles" />
        Customize card
      </button>
      {open && <CardCustomizeModal me={me} badges={badges} onClose={() => setOpen(false)} />}
    </>
  )
}

export function CardCustomizeModal({
  me,
  badges = [],
  onClose,
}: {
  me: MemberMe
  badges?: Achievement[]
  onClose: () => void
}) {
  const router = useRouter()
  const [skin, setSkin] = useState(me.card_skin || DEFAULT_CARD_SKIN)
  const [accent, setAccent] = useState<string | null>(me.card_accent ?? null)
  const [customHex, setCustomHex] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const member = me

  function pickSwatch(value: string | null) {
    setAccent(value)
    setCustomHex('')
    setError('')
  }

  function applyCustomHex() {
    const hex = customHex.trim()
    if (!hex) return
    if (!HEX_RE.test(hex)) {
      setError('Use a hex color like #3d6bff')
      return
    }
    setAccent(hex.toLowerCase())
    setError('')
  }

  async function save() {
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/me/card-prefs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skin, accent }),
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
          <h2 className="h-md">Customize your card</h2>
          <button className="modal__close" onClick={onClose} aria-label="Close">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
        <div className="modal__body">
          {error && <p className="auth-error mb-4">{error}</p>}

          <div className="card-preview">
            <CredentialCard
              skin={skin}
              accent={accent}
              member={member}
              uid={member.card?.uid ?? null}
              deptKey={member.dept}
              badges={badges}
            />
          </div>

          <h3 className="h-md mt-6 mb-3">Skin</h3>
          <div className="card-skin-row">
            {CARD_SKINS.map((s) => (
              <button
                key={s.id}
                className={`card-skin-thumb ${skin === s.id ? 'is-active' : ''}`}
                onClick={() => setSkin(s.id)}
                aria-pressed={skin === s.id}
              >
                <span className="card-skin-thumb__stage">
                  <span className="card-skin-thumb__scale">
                    {s.render({
                      member,
                      uid: member.card?.uid ?? null,
                      deptKey: member.dept,
                      badges: badges.slice(0, 3),
                      accent,
                    })}
                  </span>
                </span>
                <span className="card-skin-thumb__label">{s.name}</span>
              </button>
            ))}
          </div>

          <h3 className="h-md mt-6 mb-3">Accent color</h3>
          <div className="accent-row">
            {ACCENT_SWATCHES.map((sw) => (
              <button
                key={sw.label}
                className={`accent-swatch ${accent === sw.value ? 'is-active' : ''}`}
                style={sw.value ? { background: sw.value } : undefined}
                title={sw.label}
                aria-label={sw.label}
                aria-pressed={accent === sw.value}
                onClick={() => pickSwatch(sw.value)}
              >
                {sw.value === null && <i className="fa-solid fa-rotate-left" />}
              </button>
            ))}
            <div className="accent-custom">
              <input
                className="accent-custom__input"
                placeholder="#3d6bff"
                value={customHex}
                onChange={(e) => setCustomHex(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    applyCustomHex()
                  }
                }}
                aria-label="Custom hex color"
              />
              <button className="btn btn-ghost btn-sm" type="button" onClick={applyCustomHex}>
                Use
              </button>
            </div>
          </div>

          <p className="text-faint mt-3" style={{ fontSize: '0.78rem' }}>
            Your design shows on your profile and on your public card page. Choosing
            “Dept color” keeps the department color as the accent.
          </p>

          <div className="form-actions mt-5">
            <button className="btn btn-primary btn-sm" onClick={save} disabled={busy}>
              {busy ? <span className="spinner" /> : null}
              {busy ? 'Saving…' : 'Save design'}
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

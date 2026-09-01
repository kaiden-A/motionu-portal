'use client'

import { ICONS, iconFa } from '@/lib/icons'

export function AppIcon({ icon }: { icon: string }) {
  return <i className={`fa-solid ${iconFa(icon)}`} />
}

/** Visual icon picker — shows the actual glyph on each selectable tile. */
export function IconPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="icon-picker" role="radiogroup" aria-label="Icon">
      {ICONS.map((o) => (
        <button
          key={o.key}
          type="button"
          title={o.label}
          aria-label={o.label}
          role="radio"
          aria-checked={value === o.key}
          className={`icon-picker__opt ${value === o.key ? 'is-active' : ''}`}
          onClick={() => onChange(o.key)}
        >
          <AppIcon icon={o.key} />
        </button>
      ))}
    </div>
  )
}

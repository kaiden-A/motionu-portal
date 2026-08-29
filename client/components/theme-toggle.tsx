'use client'

import { useState } from 'react'
import { getInitialTheme, setTheme, type Theme } from '@/lib/theme'

export function ThemeToggle({ floating = false }: { floating?: boolean }) {
  const [theme, setThemeState] = useState<Theme>(() => getInitialTheme())

  function toggle() {
    const next: Theme = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    setThemeState(next)
  }

  return (
    <button
      className={floating ? 'theme-toggle--float' : 'theme-toggle'}
      onClick={toggle}
      title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      <i className={`fa-solid ${theme === 'light' ? 'fa-moon' : 'fa-sun'}`} />
    </button>
  )
}

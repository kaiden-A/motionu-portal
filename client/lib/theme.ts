export type Theme = 'light' | 'dark'

export const THEME_KEY = 'mu-theme'

export function getStoredTheme(): Theme | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = window.localStorage.getItem(THEME_KEY)
    return stored === 'light' || stored === 'dark' ? stored : null
  } catch {
    return null
  }
}

export function getSystemTheme(): Theme {
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

export function getInitialTheme(): Theme {
  return getStoredTheme() ?? getSystemTheme()
}

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('light', theme === 'light')
}

export function setTheme(theme: Theme) {
  applyTheme(theme)
  try {
    window.localStorage.setItem(THEME_KEY, theme)
  } catch {
    /* storage unavailable */
  }
}

/** Inline script for <head> — sets the theme class before first paint. */
export const THEME_INIT_SCRIPT = `try{var t=localStorage.getItem('mu-theme');var s=t==='light'||(!t&&matchMedia('(prefers-color-scheme: light)').matches);if(s){document.documentElement.classList.add('light')}}catch(e){}`

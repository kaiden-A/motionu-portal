'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ThemeToggle } from '@/components/theme-toggle'
import type { MemberMe } from '@/lib/types'

const NAV_LINKS = [
  { href: '/profile', label: 'Profile', icon: 'fa-id-card' },
  { href: '/members', label: 'Members', icon: 'fa-users' },
  { href: '/apps', label: 'Apps', icon: 'fa-grip' },
  { href: '/cards', label: 'Cards', icon: 'fa-table-columns', adminOnly: true },
]

export function Sidebar({ me }: { me: MemberMe }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    document.body.classList.toggle('has-sidebar', true)
    if (open) {
      document.body.classList.add('is-nav-open')
    } else {
      document.body.classList.remove('is-nav-open')
    }
    return () => {
      document.body.classList.remove('has-sidebar', 'is-nav-open')
    }
  }, [open])

  const links = NAV_LINKS.filter((l) => !l.adminOnly || me.is_admin)

  return (
    <>
      <button
        className="nav-toggle"
        aria-label="Toggle menu"
        onClick={() => setOpen((v) => !v)}
      >
        <i className="fa-solid fa-bars" />
      </button>
      <aside className="site-sidebar">
        <Link href="/profile" className="brand sidebar-brand">
          <span className="brand-mark">M</span>
          <span>
            Motion-U
            <br />
            <span className="brand-sub">PORTALS</span>
          </span>
        </Link>
        <nav className="sidebar-nav">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={pathname.startsWith(l.href) ? 'is-active' : ''}
            >
              <i className={`fa-solid ${l.icon}`} />
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-foot">
          <Link href="/profile" className="sidebar-user" data-dept={me.dept ?? ''}>
            <span className="sidebar-user__avatar">{me.initials}</span>
            <span className="sidebar-user__meta">
              <span className="sidebar-user__name">{me.name}</span>
              <span className="sidebar-user__role">{me.role || 'Member'}</span>
            </span>
            <i className="fa-solid fa-chevron-right sidebar-user__chev" />
          </Link>
          <ThemeToggle />
          <a
            className="sidebar-logout"
            href="/api/auth/logout"
            title="Sign out"
            aria-label="Sign out"
          >
            <i className="fa-solid fa-right-from-bracket" />
          </a>
        </div>
      </aside>
    </>
  )
}

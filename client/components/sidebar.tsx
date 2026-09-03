'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ThemeToggle } from '@/components/theme-toggle'
import { Avatar } from '@/components/avatar'
import { CAPS, type MemberMe } from '@/lib/types'

const NAV_LINKS = [
  { href: '/profile', label: 'Profile', icon: 'fa-id-card' },
  { href: '/news', label: 'News & Events', icon: 'fa-newspaper' },
  { href: '/members', label: 'Members', icon: 'fa-users' },
  { href: '/apps', label: 'Apps', icon: 'fa-grip' },
  { href: '/membership', label: 'My Membership', icon: 'fa-address-card', membership: true },
  { href: '/cards', label: 'Cards', icon: 'fa-table-columns', cap: CAPS.manageCards },
  { href: '/users', label: 'Users', icon: 'fa-user-gear', cap: CAPS.manageUsers },
  { href: '/achievements', label: 'Badges', icon: 'fa-award', cap: CAPS.manageAchievements },
  { href: '/memberships', label: 'Memberships', icon: 'fa-address-card', cap: CAPS.manageMemberships },
]

export function Sidebar({ me }: { me: MemberMe }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    document.body.classList.toggle('has-sidebar', true)
    document.body.classList.toggle('is-nav-open', open)
    return () => {
      document.body.classList.remove('has-sidebar', 'is-nav-open')
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const caps = new Set(me.caps ?? [])
  const isMembershipHolder = !!me.membership
  const links = NAV_LINKS.filter((l) => {
    if (l.cap && !caps.has(l.cap)) return false
    if ('membership' in l && l.membership && !isMembershipHolder) return false
    if (isMembershipHolder && l.href === '/members') return false
    return true
  })

  return (
    <>
      <button
        className="nav-toggle"
        aria-label="Toggle menu"
        onClick={() => setOpen((v) => !v)}
      >
        <i className="fa-solid fa-bars" />
      </button>
      {open && (
        <button
          className="nav-backdrop"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        />
      )}
      <aside className="site-sidebar">
        <Link href="/profile" className="brand sidebar-brand">
          <span className="brand-mark">
            <Image src="/icon.png" alt="Motion-U logo" width={1080} height={1080} />
          </span>
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
            <Avatar
              className="sidebar-user__avatar"
              name={me.name}
              initials={me.initials}
              avatarUrl={me.avatar_url}
              dept={me.dept}
            />
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

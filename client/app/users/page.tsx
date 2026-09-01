import { redirect } from 'next/navigation'
import { UsersManageModal, UserRowActions } from '@/components/users-manage-modal'
import { Sidebar } from '@/components/sidebar'
import { backendFetch } from '@/lib/backend'
import { getAccessToken } from '@/lib/backend'
import { CAPS, ROLE_SHORT, type MemberMe, type PortalUser } from '@/lib/types'

export const metadata = { title: 'User Management · Motion-U Portals' }

export default async function UsersPage() {
  const token = await getAccessToken()
  if (!token) redirect('/login')

  const [users, me] = await Promise.all([
    backendFetch<PortalUser[]>('/api/v1/users'),
    backendFetch<MemberMe>('/api/v1/members/me'),
  ])

  if (!me.caps.includes(CAPS.manageUsers)) redirect('/profile')

  const activeCount = users.filter((u) => u.active).length
  const suspendedCount = users.length - activeCount
  const cardedCount = users.filter((u) => u.card_id).length

  return (
    <>
      <Sidebar me={me} />
      <div className="wrap" style={{ paddingTop: 56, paddingBottom: 64 }}>
        <section style={{ paddingBottom: 32 }}>
          <span className="eyebrow">Admin</span>
          <h1 className="h-xl mt-4">User management</h1>
          <p className="lede mt-4">
            Zitadel is the source of truth. Changes made here are written to Zitadel
            first, then mirrored to the portal — card assignments survive every edit
            because the user ID never changes.
          </p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5" style={{ marginBottom: 32 }}>
          <div className="stat-card">
            <div className="stat-num">{activeCount}</div>
            <div className="stat-label">Active members</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{suspendedCount}</div>
            <div className="stat-label">Suspended (blocked from all apps)</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{cardedCount}</div>
            <div className="stat-label">Members with a card</div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4" style={{ flexWrap: 'wrap', gap: 12 }}>
          <p className="session-note">
            Suspending a user in Zitadel blocks their sign-in for every system that uses it.
          </p>
          <UsersManageModal users={users} />
        </div>

        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Email</th>
                <th>Roles</th>
                <th>Department</th>
                <th>Card</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="mini-avatar" data-dept={u.dept ?? ''}>
                        {(u.name || '?').split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()}
                      </div>
                      {u.name}
                    </div>
                  </td>
                  <td className="font-mono" style={{ fontSize: '0.78rem' }}>{u.email}</td>
                  <td>
                    <div className="flex gap-1" style={{ flexWrap: 'wrap' }}>
                      {u.roles.filter((r) => r !== 'member').map((r) => (
                        <span key={r} className={`role-chip ${r === 'super_admin' ? 'is-admin' : ''}`}>
                          {ROLE_SHORT[r] ?? r}
                        </span>
                      ))}
                      {!u.roles.filter((r) => r !== 'member').length && <span className="role-chip">Member</span>}
                    </div>
                  </td>
                  <td>
                    <span className="text-faint">{u.dept ? ROLE_SHORT[u.dept === 'mainboard' ? 'mainboards' : u.dept] ?? u.dept : '—'}</span>
                  </td>
                  <td>
                    {u.card_id ? <span className="font-mono uid-tag">{u.card_id}</span> : <span className="text-faint">—</span>}
                  </td>
                  <td>
                    <span className={`status-pill ${u.active ? 'active' : 'unassigned'}`}>
                      {u.active ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td>
                    <UserRowActions user={u} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!users.length && <p className="text-faint mt-8">No users found in the Zitadel directory.</p>}
      </div>
    </>
  )
}

import { redirect } from 'next/navigation'
import { MembershipAddButton, MembershipEditButton, PlansManageButton } from '@/components/membership-actions'
import { MembershipCardSelect } from '@/components/membership-card-select'
import { Sidebar } from '@/components/sidebar'
import { Avatar } from '@/components/avatar'
import { MembershipStatusPill } from '@/components/badge'
import { backendFetch } from '@/lib/backend'
import { getAccessToken } from '@/lib/backend'
import {
  CAPS,
  type CardAdmin,
  type MemberMe,
  type MembershipAdmin,
  type MembershipPlan,
} from '@/lib/types'

export const metadata = { title: 'Memberships · Motion-U Portals' }

export default async function MembershipsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; mstatus?: string }>
}) {
  const token = await getAccessToken()
  if (!token) redirect('/login')

  const params = await searchParams
  const qs = new URLSearchParams()
  if (params.search) qs.set('search', params.search)
  if (params.mstatus) qs.set('mstatus', params.mstatus)
  const q = qs.toString()

  const [list, plans, me, cards] = await Promise.all([
    backendFetch<MembershipAdmin[]>(`/api/v1/memberships${q ? `?${q}` : ''}`),
    backendFetch<MembershipPlan[]>('/api/v1/memberships/plans'),
    backendFetch<MemberMe>('/api/v1/members/me'),
    backendFetch<CardAdmin[]>('/api/v1/cards'),
  ])

  if (!me.caps.includes(CAPS.manageMemberships)) redirect('/profile')

  const active = list.filter((m) => m.status === 'active').length
  const expired = list.filter((m) => m.status === 'expired').length
  const carded = list.filter((m) => m.card_id).length

  return (
    <>
      <Sidebar me={me} />
      <div className="wrap" style={{ paddingTop: 56, paddingBottom: 64 }}>
        <section style={{ paddingBottom: 32 }}>
          <span className="eyebrow">Admin</span>
          <h1 className="h-xl mt-4">Membership management</h1>
          <p className="lede mt-4">
            The Motion-U memberships program — holders sign in with their own account,
            get a card, and access the member apps, news and events.
          </p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5" style={{ marginBottom: 32 }}>
          <div className="stat-card">
            <div className="stat-num">{list.length}</div>
            <div className="stat-label">Membership holders</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{active}</div>
            <div className="stat-label">Active</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{expired}</div>
            <div className="stat-label">Expired or cancelled</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{carded}</div>
            <div className="stat-label">Holders with a card</div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4" style={{ flexWrap: 'wrap', gap: 12 }}>
          <form method="get" className="flex gap-2" style={{ flexWrap: 'wrap' }}>
            <input
              className="form-full"
              name="search"
              placeholder="Search name or email…"
              defaultValue={params.search ?? ''}
              style={{ width: 260 }}
            />
            <select className="form-full" name="mstatus" defaultValue={params.mstatus ?? ''} style={{ width: 150 }}>
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <button className="btn btn-ghost btn-sm" type="submit">
              Filter
            </button>
          </form>
          <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
            <PlansManageButton plans={plans} />
            <MembershipAddButton plans={plans} />
          </div>
        </div>

        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Holder</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Period</th>
                <th>Card</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((m) => (
                <tr key={m.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <Avatar
                        className="mini-avatar"
                        name={m.name}
                        avatarUrl={m.avatar_url}
                      />
                      <div>
                        <div style={{ fontWeight: 600 }}>{m.name}</div>
                        <div className="uid-tag">{m.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    {m.plan ? (
                      <div>
                        <div style={{ fontWeight: 600 }}>{m.plan.name}</div>
                        <div className="uid-tag">
                          {m.plan.duration_days ? `${m.plan.duration_days}d` : ''}
                          {m.plan.price_cents != null
                            ? ` · ₱${(m.plan.price_cents / 100).toFixed(2)}`
                            : ''}
                        </div>
                      </div>
                    ) : (
                      <span className="text-faint">—</span>
                    )}
                  </td>
                  <td>
                    <MembershipStatusPill status={m.status} />
                  </td>
                  <td>
                    <div className="uid-tag">
                      {new Date(m.starts_at).toLocaleDateString()}
                      {m.ends_at ? ` → ${new Date(m.ends_at).toLocaleDateString()}` : ''}
                    </div>
                    {m.auto_renew && <div className="uid-tag text-faint">auto-renew</div>}
                  </td>
                  <td>
                    <MembershipCardSelect membership={m} cards={cards} />
                  </td>
                  <td>
                    <MembershipEditButton membership={m} plans={plans} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!list.length && (
          <p className="text-faint mt-6">
            {q ? 'No memberships match that filter.' : 'No membership holders yet — add the first one.'}
          </p>
        )}
      </div>
    </>
  )
}

import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/sidebar'
import { MembershipStatusPill, StatusPill } from '@/components/badge'
import { backendFetch, BackendError } from '@/lib/backend'
import { getAccessToken } from '@/lib/backend'
import type { MemberMe, MembershipMe } from '@/lib/types'

export const metadata = { title: 'My Membership · Motion-U Portals' }

async function getMe(): Promise<MemberMe | null> {
  try {
    return await backendFetch<MemberMe>('/api/v1/members/me')
  } catch (e) {
    if (e instanceof BackendError && e.status === 401) return null
    throw e
  }
}

async function getMembership(): Promise<MembershipMe | null> {
  try {
    return await backendFetch<MembershipMe>('/api/v1/memberships/me')
  } catch (e) {
    if (e instanceof BackendError && (e.status === 401 || e.status === 404)) return null
    throw e
  }
}

export default async function MembershipPage() {
  const token = await getAccessToken()
  if (!token) redirect('/login')

  const me = await getMe()
  if (!me) redirect('/login')

  const membership = await getMembership()
  if (!membership) redirect('/profile')

  return (
    <>
      <Sidebar me={me} />
      <div className="wrap" style={{ paddingTop: 56, paddingBottom: 64 }}>
        <section>
          <span className="eyebrow">Membership program</span>
          <h1 className="h-xl mt-4">My Motion-U membership</h1>
          <p className="lede mt-4">
            Your benefits, your card, and the dates that keep them running.
          </p>
        </section>

        <section style={{ marginTop: 40 }} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="panel" style={{ alignSelf: 'start' }}>
            <span className="eyebrow">Status</span>
            <div className="mt-4 flex" style={{ gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <MembershipStatusPill status={membership.status} />
              {membership.card ? <StatusPill assigned /> : null}
            </div>
            <div className="mt-4">
              <div className="font-mono text-faint" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>
                Valid from
              </div>
              <div className="mt-1 h-md" style={{ fontWeight: 700 }}>
                {new Date(membership.starts_at).toLocaleDateString()}
              </div>
            </div>
            <div className="mt-4">
              <div className="font-mono text-faint" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>
                Valid until
              </div>
              <div className="mt-1 h-md" style={{ fontWeight: 700 }}>
                {membership.ends_at ? new Date(membership.ends_at).toLocaleDateString() : 'Open-ended'}
              </div>
              {membership.auto_renew && (
                <p className="uid-tag mt-1">auto-renews</p>
              )}
            </div>
            <div className="mt-4">
              <div className="font-mono text-faint" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>
                Membership card
              </div>
              <div className="mt-1">
                {membership.card ? (
                  <div className="uid-tag" style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                    {membership.card.card_id}
                    <span className="text-faint" style={{ fontWeight: 400 }}> · {membership.card.uid}</span>
                  </div>
                ) : (
                  <span className="text-faint">No card assigned yet — see the front desk.</span>
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="panel">
              <span className="eyebrow">Plan</span>
              <div className="mt-2 h-lg" style={{ fontWeight: 800 }}>
                {membership.plan?.name ?? 'No plan'}
              </div>
              {membership.plan?.desc && (
                <p className="lede mt-2" style={{ fontSize: '0.85rem' }}>
                  {membership.plan.desc}
                </p>
              )}
            </div>

            <div className="panel mt-4">
              <span className="eyebrow">Benefits</span>
              {membership.plan?.benefits?.length ? (
                <ul className="mt-3 flex" style={{ flexDirection: 'column', gap: 10 }}>
                  {membership.plan.benefits.map((b) => (
                    <li key={b} className="flex items-center gap-2" style={{ fontSize: '0.88rem' }}>
                      <i className="fa-solid fa-circle-check" style={{ color: 'var(--royal)' }} />
                      {b}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-faint mt-3" style={{ fontSize: '0.85rem' }}>
                  Benefits are listed here once your plan is set.
                </p>
              )}
            </div>

            <div className="panel mt-4">
              <span className="eyebrow">Member access</span>
                <p className="text-faint mt-2" style={{ fontSize: '0.85rem' }}>
                  Your membership unlocks the member apps in the App directory plus News &amp;
                  Events. Keep your membership active to keep the access.
                </p>
              </div>
          </div>
        </section>
      </div>
    </>
  )
}

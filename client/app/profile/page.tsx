import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/sidebar'
import { IdBadge, Achievement, StatusPill, DeptTag, RoleChips } from '@/components/badge'
import { backendFetch, BackendError } from '@/lib/backend'
import { getAccessToken } from '@/lib/backend'
import type { MemberMe } from '@/lib/types'

export const metadata = { title: 'Profile · Motion-U Portals' }

async function getMe(): Promise<MemberMe | null> {
  try {
    return await backendFetch<MemberMe>('/api/v1/members/me')
  } catch (e) {
    if (e instanceof BackendError && e.status === 401) return null
    throw e
  }
}

export default async function ProfilePage() {
  const token = await getAccessToken()
  if (!token) redirect('/login')

  const me = await getMe()
  if (!me) redirect('/login')

  return (
    <>
      <Sidebar me={me} />
      <div className="wrap" style={{ paddingTop: 56, paddingBottom: 64 }}>
        <section>
          <span className="eyebrow">Member profile</span>
          <h1 className="h-xl mt-4">My credential</h1>
          <p className="lede mt-4">
            One card, every department, event, and achievement — yours.
          </p>
        </section>

        <section style={{ marginTop: 40 }} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="panel" style={{ alignSelf: 'start' }}>
            <span className="eyebrow">Digital card</span>
            <div className="mt-4 flex" style={{ justifyContent: 'center' }}>
              <IdBadge
                member={me}
                uid={me.card?.uid ?? null}
                tilt
                deptKey={me.dept}
              />
            </div>
            <div className="mt-4" style={{ textAlign: 'center' }}>
              {me.card ? (
                <>
                  <StatusPill assigned />
                  <div className="uid-tag mt-2">{me.card.uid}</div>
                </>
              ) : (
                <StatusPill assigned={false} />
              )}
            </div>
          </div>

          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ gap: 16 }}>
              <div className="panel">
                <span className="font-mono text-faint" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>
                  Card status
                </span>
                <div className="mt-2" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  {me.card ? (
                    <>
                      <StatusPill assigned />
                      <DeptTag short={me.card.member?.department?.short} />
                    </>
                  ) : (
                    <StatusPill assigned={false} />
                  )}
                </div>
              </div>
              <div className="panel">
                <span className="font-mono text-faint" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>
                  Member since
                </span>
                <div className="mt-2 h-md" style={{ textTransform: 'none', fontFamily: 'var(--font-body)', fontWeight: 700 }}>
                  {me.card?.member?.member_since
                    ? new Date(me.card.member.member_since).toLocaleDateString()
                    : 'This season'}
                </div>
              </div>
            </div>

            <div className="panel mt-4">
              <span className="eyebrow">Roles</span>
              <RoleChips roles={me.roles} />
              {!me.roles?.length && (
                <p className="text-faint" style={{ fontSize: '0.82rem', marginTop: 8 }}>
                  No Zitadel roles assigned yet.
                </p>
              )}
            </div>

            <div className="mt-8">
              <span className="eyebrow">Badges earned</span>
              <div className="flex mt-4" style={{ flexDirection: 'column', gap: 10 }}>
                {me.achievements.length ? (
                  me.achievements.map((a) => <Achievement key={a} label={a} />)
                ) : (
                  <p className="text-faint">
                    No badges yet — first tap at a station starts the record.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}

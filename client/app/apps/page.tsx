import { AppsGrid } from '@/components/apps-grid'
import { Sidebar } from '@/components/sidebar'
import { backendFetch } from '@/lib/backend'
import { getAccessToken } from '@/lib/backend'
import { CAPS, type AppPublic, type MemberMe } from '@/lib/types'

export const metadata = { title: 'Apps · Motion-U Portals' }

export default async function AppsPage() {
  const token = await getAccessToken()
  const [apps, me] = await Promise.all([
    backendFetch<AppPublic[]>('/api/v1/apps', { auth: false }),
    token ? backendFetch<MemberMe>('/api/v1/members/me') : Promise.resolve(null),
  ])

  return (
    <>
      {me ? <Sidebar me={me} /> : null}
      <div className={`wrap ${me ? '' : ''}`} style={{ paddingTop: 56, paddingBottom: 64 }}>
        <section style={{ paddingBottom: 32 }}>
          <span className="eyebrow">Directory</span>
          <h1 className="h-xl mt-4">Every Motion-U app, in one place</h1>
          <p className="lede mt-4">
            Internal tools committees run day to day — every Motion-U app in one place.
          </p>
        </section>
        <AppsGrid apps={apps} admin={!!me?.caps.includes(CAPS.manageApps)} />
      </div>
    </>
  )
}

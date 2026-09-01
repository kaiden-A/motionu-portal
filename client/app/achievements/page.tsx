import { redirect } from 'next/navigation'
import { AchievementsAdmin } from '@/components/achievements-admin'
import { Sidebar } from '@/components/sidebar'
import { backendFetch } from '@/lib/backend'
import { getAccessToken } from '@/lib/backend'
import { CAPS, type Achievement, type MemberDirectoryItem, type MemberMe } from '@/lib/types'

export const metadata = { title: 'Badges & Achievements · Motion-U Portals' }

export default async function AchievementsPage() {
  const token = await getAccessToken()
  if (!token) redirect('/login')

  const [badges, members, me] = await Promise.all([
    backendFetch<Achievement[]>('/api/v1/achievements/all'),
    backendFetch<MemberDirectoryItem[]>('/api/v1/members'),
    backendFetch<MemberMe>('/api/v1/members/me'),
  ])

  if (!me.caps.includes(CAPS.manageAchievements)) redirect('/profile')

  return (
    <>
      <Sidebar me={me} />
      <div className="wrap" style={{ paddingTop: 56, paddingBottom: 64 }}>
        <section style={{ paddingBottom: 32 }}>
          <span className="eyebrow">Admin</span>
          <h1 className="h-xl mt-4">Badges &amp; achievements</h1>
          <p className="lede mt-4">
            Create badges for the catalog, then assign them to members — they show up
            on profiles and in the directory instantly.
          </p>
        </section>
        <AchievementsAdmin badges={badges} members={members} />
      </div>
    </>
  )
}

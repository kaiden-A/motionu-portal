import { redirect } from 'next/navigation'
import { MembersGrid } from '@/components/members-grid'
import { Sidebar } from '@/components/sidebar'
import { backendFetch } from '@/lib/backend'
import { getAccessToken } from '@/lib/backend'
import type { Achievement, MemberDirectoryItem, MemberMe } from '@/lib/types'

export const metadata = { title: 'Members · Motion-U Portals' }

export default async function MembersPage() {
  const token = await getAccessToken()
  if (!token) redirect('/login')

  const [members, me, badges] = await Promise.all([
    backendFetch<MemberDirectoryItem[]>('/api/v1/members'),
    backendFetch<MemberMe>('/api/v1/members/me'),
    backendFetch<Achievement[]>('/api/v1/achievements').catch(() => [] as Achievement[]),
  ])

  return (
    <>
      <Sidebar me={me} />
      <div className="wrap" style={{ paddingTop: 56, paddingBottom: 64 }}>
        <section style={{ paddingBottom: 32 }}>
          <span className="eyebrow">Directory</span>
          <h1 className="h-xl mt-4">Every member, one directory</h1>
          <p className="lede mt-4">
            Search by name, or filter by department to see who carries which roles.
          </p>
        </section>
        <MembersGrid members={members} badges={badges} currentSub={me.zitadel_sub} />
      </div>
    </>
  )
}

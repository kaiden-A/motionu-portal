import { redirect } from 'next/navigation'
import { AppsManage } from '@/components/apps-manage'
import { Sidebar } from '@/components/sidebar'
import { backendFetch } from '@/lib/backend'
import { getAccessToken } from '@/lib/backend'
import type { AppPublic, MemberMe } from '@/lib/types'

export const metadata = { title: 'Manage Apps · Motion-U Portals' }

export default async function AppsManagePage() {
  const token = await getAccessToken()
  if (!token) redirect('/login')

  const [apps, me] = await Promise.all([
    backendFetch<AppPublic[]>('/api/v1/apps/all'),
    backendFetch<MemberMe>('/api/v1/members/me'),
  ])

  if (!me.is_admin) redirect('/apps')

  return (
    <>
      <Sidebar me={me} />
      <div className="wrap" style={{ paddingTop: 56, paddingBottom: 64 }}>
        <section style={{ paddingBottom: 24 }}>
          <span className="eyebrow">Admin</span>
          <h1 className="h-xl mt-16">Manage apps</h1>
          <p className="lede mt-16">
            Add, edit, enable, or remove entries in the app directory.
          </p>
        </section>
        <AppsManage apps={apps} />
      </div>
    </>
  )
}

import { redirect } from 'next/navigation'
import { AssignSelect } from '@/components/assign-select'
import { RegisterCardForm } from '@/components/register-card-form'
import { Sidebar } from '@/components/sidebar'
import { Avatar } from '@/components/avatar'
import { StatusPill, DeptTag } from '@/components/badge'
import { backendFetch } from '@/lib/backend'
import { getAccessToken } from '@/lib/backend'
import { CAPS, type CardAdmin, type DirectoryUser, type MemberMe } from '@/lib/types'

export const metadata = { title: 'Card Management · Motion-U Portals' }

export default async function CardsPage() {
  const token = await getAccessToken()
  if (!token) redirect('/login')

  const [cards, directory, me] = await Promise.all([
    backendFetch<CardAdmin[]>('/api/v1/cards'),
    backendFetch<DirectoryUser[]>('/api/v1/cards/directory/list'),
    backendFetch<MemberMe>('/api/v1/members/me'),
  ])

  if (!me.caps.includes(CAPS.manageCards)) redirect('/profile')

  const assignedCount = cards.filter((c) => c.assigned).length
  const unassignedCount = cards.length - assignedCount
  const nextCardNum = cards.reduce((max, c) => {
    const m = /^CARD-(\d+)$/.exec(c.card_id)
    return m ? Math.max(max, Number(m[1])) : max
  }, 0)
  const nextCardId = `CARD-${String(nextCardNum + 1).padStart(3, '0')}`

  return (
    <>
      <Sidebar me={me} />
      <div className="wrap" style={{ paddingTop: 56, paddingBottom: 64 }}>
        <section style={{ paddingBottom: 32 }}>
          <span className="eyebrow">Admin</span>
          <h1 className="h-xl mt-4">Card management</h1>
          <p className="lede mt-4">
            Cards are physical; the assignment is digital. Assign any card to a Zitadel
            member — the assignment syncs to the public card page instantly.
          </p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" style={{ marginBottom: 32 }}>
          <div className="stat-card">
            <div className="stat-num">{assignedCount}</div>
            <div className="stat-label">Cards assigned</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{unassignedCount}</div>
            <div className="stat-label">Unassigned, ready to hand out</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{cards.length}</div>
            <div className="stat-label">Total cards in circulation</div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4" style={{ flexWrap: 'wrap', gap: 12 }}>
          <p className="session-note">
            Assignments are saved to the database and sync across devices.
          </p>
          <RegisterCardForm nextCardId={nextCardId} />
        </div>

        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Card</th>
                <th>UID</th>
                <th>Assigned to</th>
                <th>Department</th>
                <th>Status</th>
                <th>Reassign</th>
              </tr>
            </thead>
            <tbody>
              {cards.map((c) => (
                <tr key={c.card_id}>
                  <td className="font-mono">{c.card_id}</td>
                  <td className="uid-tag">{c.uid}</td>
                  <td>
                    {c.member ? (
                      <div className="flex items-center gap-2">
                        <Avatar
                          className="mini-avatar"
                          name={c.member.name}
                          initials={c.member.initials}
                          avatarUrl={c.member.avatar_url}
                          dept={c.member.dept}
                        />
                        {c.member.name}
                      </div>
                    ) : (
                      <span className="text-faint">— none —</span>
                    )}
                  </td>
                  <td>
                    <DeptTag short={c.member?.department?.short} />
                  </td>
                  <td>
                    <StatusPill assigned={c.assigned} />
                  </td>
                  <td>
                    <AssignSelect card={c} directory={directory} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

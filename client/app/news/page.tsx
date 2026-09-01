import { redirect } from 'next/navigation'
import { NewsAdminModal } from '@/components/news-admin-modal'
import { Sidebar } from '@/components/sidebar'
import { DeptTag } from '@/components/badge'
import { backendFetch } from '@/lib/backend'
import { getAccessToken } from '@/lib/backend'
import { CAPS, type MemberMe, type NewsItem, type PortalEvent } from '@/lib/types'

export const metadata = { title: 'News & Events · Motion-U Portals' }

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function NewsPage() {
  const token = await getAccessToken()
  if (!token) redirect('/login')

  const [news, events, me] = await Promise.all([
    backendFetch<NewsItem[]>('/api/v1/news'),
    backendFetch<PortalEvent[]>('/api/v1/events'),
    backendFetch<MemberMe>('/api/v1/members/me'),
  ])

  // eslint-disable-next-line react-hooks/purity -- server-render freshness
  const now = Date.now()
  const upcoming = events.filter((e) => new Date(e.starts_at).getTime() >= now)

  return (
    <>
      <Sidebar me={me} />
      <div className="wrap" style={{ paddingTop: 56, paddingBottom: 64 }}>
        <section style={{ paddingBottom: 32 }}>
          <span className="eyebrow">Community</span>
          <h1 className="h-xl mt-4">News &amp; events</h1>
          <p className="lede mt-4">
            What the association is doing, announcing, and getting ready for.
          </p>
          {me.caps.includes(CAPS.manageNews) && (
            <div className="mt-4">
              <NewsAdminModal news={news} events={events} />
            </div>
          )}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {news.map((n) => (
              <article key={n.id} className={`panel news-card ${n.pinned ? 'news-card--pinned' : ''}`}>
                <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
                  {n.pinned && <span className="status-pill active">Pinned</span>}
                  <span className="font-mono text-faint" style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>
                    {formatDate(n.published_at)} · {n.author_name}
                  </span>
                  {n.dept && <DeptTag short={n.dept} />}
                </div>
                <h2 className="h-md mt-2" style={{ lineHeight: 1.25 }}>{n.title}</h2>
                <p className="mt-2" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{n.body}</p>
              </article>
            ))}
            {!news.length && (
              <p className="text-faint">No news yet — announcements will appear here.</p>
            )}
          </div>

          <aside className="panel" style={{ alignSelf: 'start' }}>
            <span className="eyebrow">Upcoming events</span>
            <div className="mt-4" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {upcoming.map((e) => (
                <div key={e.id} className="event-item">
                  <div className="event-item__date font-mono">
                    {formatTime(e.starts_at)}
                    {e.ends_at ? <> – {formatTime(e.ends_at)}</> : null}
                  </div>
                  <div className="h-md" style={{ fontSize: '0.95rem' }}>{e.title}</div>
                  {e.description && (
                    <p className="text-dim" style={{ fontSize: '0.82rem', marginTop: 4 }}>{e.description}</p>
                  )}
                  <div className="mt-1" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    {e.location && (
                      <span className="text-faint" style={{ fontSize: '0.78rem' }}>
                        <i className="fa-solid fa-location-dot" /> {e.location}
                      </span>
                    )}
                    {e.dept && <DeptTag short={e.dept} />}
                  </div>
                </div>
              ))}
              {!upcoming.length && (
                <p className="text-faint" style={{ fontSize: '0.85rem' }}>Nothing scheduled yet.</p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </>
  )
}

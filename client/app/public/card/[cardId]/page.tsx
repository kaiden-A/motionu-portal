import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ClaimButton } from '@/components/claim-button'
import { IdBadge, Achievement, StatusPill, DeptTag } from '@/components/badge'
import { backendFetch } from '@/lib/backend'
import { getSession } from '@/lib/session'
import type { CardPublic } from '@/lib/types'

export const metadata: Metadata = { title: 'Card · Motion-U Portals' }

export default async function PublicCardPage({
  params,
}: {
  params: Promise<{ cardId: string }>
}) {
  const { cardId } = await params

  let card: CardPublic | null = null
  try {
    card = await backendFetch<CardPublic>(
      `/api/v1/cards/${encodeURIComponent(cardId)}`,
      { auth: false }
    )
  } catch {
    notFound()
  }

  const session = await getSession()

  return (
    <body className="public-body">
      <main className="public-shell">
        <div className="auth-brand" style={{ justifyContent: 'center' }}>
          <span className="brand-mark">M</span>
          <span className="auth-brand__name">
            Motion-U <span className="brand-sub">PORTALS</span>
          </span>
        </div>

        <div className="public-card-frame mt-6">
          <span className="eyebrow">Card · {card.card_id}</span>
          <div className="uid-tag">{card.uid}</div>

          {card.assigned && card.member ? (
            <>
              <IdBadge
                member={card.member}
                uid={card.uid}
                tilt
                deptKey={card.member.dept}
              />
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <StatusPill assigned />
                <DeptTag short={card.member.department?.short} />
              </div>
              <div className="flex" style={{ flexDirection: 'column', gap: 10, width: '100%' }}>
                <span className="eyebrow" style={{ justifyContent: 'center' }}>
                  Badges earned
                </span>
                {card.member.achievements.length ? (
                  card.member.achievements.map((a) => (
                    <Achievement key={a} label={a} />
                  ))
                ) : (
                  <p className="text-faint" style={{ fontSize: '0.82rem' }}>
                    No badges yet — this member&apos;s record is just starting.
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              <h1 className="h-lg" style={{ textTransform: 'none', lineHeight: 1.1 }}>
                This card is unclaimed
              </h1>
              <p className="text-dim" style={{ fontSize: '0.92rem', maxWidth: '36ch' }}>
                This card hasn&apos;t been linked to a member yet. Sign in to attach it to
                your profile.
              </p>
              {session ? (
                <ClaimButton cardId={card.card_id} />
              ) : (
                <a
                  href={`/api/auth/login?next=${encodeURIComponent(`/public/card/${card.card_id}`)}`}
                  className="btn btn-primary btn-block"
                >
                  <i className="fa-solid fa-right-to-bracket" />
                  Sign in to claim
                </a>
              )}
            </>
          )}
        </div>
      </main>
    </body>
  )
}

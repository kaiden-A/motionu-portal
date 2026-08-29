import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ClaimButton } from '@/components/claim-button'
import { StatusPill, DeptTag } from '@/components/badge'
import { LanyardCard } from '@/components/lanyard-card'
import { ThemeToggle } from '@/components/theme-toggle'
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
      <ThemeToggle floating />
      <main
        className="public-shell flex flex-col gap-6"
        style={{ justifyContent: 'center', minHeight: '100dvh' }}
      >
        {card.assigned && card.member ? (
          <>
            <LanyardCard
              member={card.member}
              uid={card.uid}
              deptKey={card.member.dept}
            />
            <div className="flex items-center justify-center gap-2">
              <StatusPill assigned />
              <DeptTag short={card.member.department?.short} />
            </div>
          </>
        ) : (
          <>
            <div className="w-full flex flex-col items-center gap-4">
              <span className="eyebrow">Card · {card.card_id}</span>
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
            </div>
          </>
        )}
      </main>
    </body>
  )
}

import { NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ cardId: string }> }
) {
  const { cardId } = await params
  try {
    const body = (await request.json()) as { zitadel_sub?: string | null }
    const data = await backendFetch<unknown>(
      `/api/v1/cards/${encodeURIComponent(cardId)}/assign`,
      { method: 'POST', body: { zitadel_sub: body.zitadel_sub ?? null } }
    )
    return NextResponse.json(data)
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500
    const message = (e as Error).message ?? 'Assign failed'
    return NextResponse.json({ error: message }, { status })
  }
}

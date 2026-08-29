import { NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ cardId: string }> }
) {
  const { cardId } = await params
  try {
    const data = await backendFetch<unknown>(
      `/api/v1/cards/${encodeURIComponent(cardId)}`,
      { auth: false }
    )
    return NextResponse.json(data)
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500
    const message = (e as Error).message ?? 'Card lookup failed'
    return NextResponse.json({ error: message }, { status })
  }
}

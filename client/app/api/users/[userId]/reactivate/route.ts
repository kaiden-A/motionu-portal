import { NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params
  try {
    const data = await backendFetch<unknown>(
      `/api/v1/users/${encodeURIComponent(userId)}/reactivate`,
      { method: 'POST' }
    )
    return NextResponse.json(data)
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500
    const message = (e as Error).message ?? 'Reactivate failed'
    return NextResponse.json({ error: message }, { status })
  }
}

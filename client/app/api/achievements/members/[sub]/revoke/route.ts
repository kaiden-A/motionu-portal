import { NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sub: string }> }
) {
  const { sub } = await params
  try {
    const body = (await request.json()) as { keys?: string[] }
    if (!Array.isArray(body.keys)) {
      return NextResponse.json({ error: 'keys (array) is required' }, { status: 400 })
    }
    const data = await backendFetch<unknown>(
      `/api/v1/achievements/members/${encodeURIComponent(sub)}/revoke`,
      { method: 'POST', body: { keys: body.keys } }
    )
    return NextResponse.json(data)
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500
    const message = (e as Error).message ?? 'Revoke achievements failed'
    return NextResponse.json({ error: message }, { status })
  }
}

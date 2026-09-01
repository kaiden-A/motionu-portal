import { NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params
  try {
    const body = (await request.json()) as Record<string, unknown>
    const data = await backendFetch<unknown>(`/api/v1/users/${encodeURIComponent(userId)}`, {
      method: 'PATCH',
      body,
    })
    return NextResponse.json(data)
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500
    const message = (e as Error).message ?? 'Update user failed'
    return NextResponse.json({ error: message }, { status })
  }
}

import { NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params
  try {
    const body = (await request.json()) as Record<string, unknown>
    const data = await backendFetch<unknown>(`/api/v1/achievements/${encodeURIComponent(key)}`, {
      method: 'PATCH',
      body,
    })
    return NextResponse.json(data)
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500
    const message = (e as Error).message ?? 'Update achievement failed'
    return NextResponse.json({ error: message }, { status })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params
  try {
    await backendFetch<unknown>(`/api/v1/achievements/${encodeURIComponent(key)}`, {
      method: 'DELETE',
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500
    const message = (e as Error).message ?? 'Delete achievement failed'
    return NextResponse.json({ error: message }, { status })
  }
}

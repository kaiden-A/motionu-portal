import { NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ newsId: string }> }
) {
  const { newsId } = await params
  try {
    const body = (await request.json()) as Record<string, unknown>
    const data = await backendFetch<unknown>(`/api/v1/news/${newsId}`, {
      method: 'PATCH',
      body,
    })
    return NextResponse.json(data)
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500
    const message = (e as Error).message ?? 'Update news failed'
    return NextResponse.json({ error: message }, { status })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ newsId: string }> }
) {
  const { newsId } = await params
  try {
    await backendFetch<unknown>(`/api/v1/news/${newsId}`, { method: 'DELETE' })
    return NextResponse.json({ ok: true })
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500
    const message = (e as Error).message ?? 'Delete news failed'
    return NextResponse.json({ error: message }, { status })
  }
}

import { NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params
  try {
    const body = (await request.json()) as Record<string, unknown>
    const data = await backendFetch<unknown>(`/api/v1/events/${eventId}`, {
      method: 'PATCH',
      body,
    })
    return NextResponse.json(data)
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500
    const message = (e as Error).message ?? 'Update event failed'
    return NextResponse.json({ error: message }, { status })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params
  try {
    await backendFetch<unknown>(`/api/v1/events/${eventId}`, { method: 'DELETE' })
    return NextResponse.json({ ok: true })
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500
    const message = (e as Error).message ?? 'Delete event failed'
    return NextResponse.json({ error: message }, { status })
  }
}

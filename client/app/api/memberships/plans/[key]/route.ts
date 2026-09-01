import { NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params
    const body = await request.json()
    const data = await backendFetch<unknown>(
      `/api/v1/memberships/plans/${encodeURIComponent(key)}`,
      { method: 'PATCH', body }
    )
    return NextResponse.json(data)
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500
    const message = (e as Error).message ?? 'Update membership plan failed'
    return NextResponse.json({ error: message }, { status })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params
    await backendFetch<unknown>(`/api/v1/memberships/plans/${encodeURIComponent(key)}`, {
      method: 'DELETE',
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500
    const message = (e as Error).message ?? 'Delete membership plan failed'
    return NextResponse.json({ error: message }, { status })
  }
}

import { NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ appId: string }> }
) {
  const { appId } = await params
  try {
    const body = (await request.json()) as Record<string, unknown>
    const data = await backendFetch<unknown>(`/api/v1/apps/${encodeURIComponent(appId)}`, {
      method: 'PATCH',
      body,
    })
    return NextResponse.json(data)
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500
    const message = (e as Error).message ?? 'Update app failed'
    return NextResponse.json({ error: message }, { status })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ appId: string }> }
) {
  const { appId } = await params
  try {
    await backendFetch<unknown>(`/api/v1/apps/${encodeURIComponent(appId)}`, {
      method: 'DELETE',
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500
    const message = (e as Error).message ?? 'Delete app failed'
    return NextResponse.json({ error: message }, { status })
  }
}

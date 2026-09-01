import { NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend'

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const data = await backendFetch<unknown>('/api/v1/members/me/card-prefs', {
      method: 'PATCH',
      body,
    })
    return NextResponse.json(data)
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500
    const message = (e as Error).message ?? 'Save failed'
    return NextResponse.json({ error: message }, { status })
  }
}

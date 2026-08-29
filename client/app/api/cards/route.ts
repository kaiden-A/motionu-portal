import { NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend'

export async function GET() {
  try {
    const data = await backendFetch<unknown>('/api/v1/cards')
    return NextResponse.json(data)
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500
    const message = (e as Error).message ?? 'List cards failed'
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { card_id?: string; uid?: string }
    if (!body.card_id || !body.uid) {
      return NextResponse.json(
        { error: 'card_id and uid are required' },
        { status: 400 }
      )
    }
    const data = await backendFetch<unknown>('/api/v1/cards', {
      method: 'POST',
      body: { card_id: body.card_id, uid: body.uid },
    })
    return NextResponse.json(data, { status: 201 })
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500
    const message = (e as Error).message ?? 'Register card failed'
    return NextResponse.json({ error: message }, { status })
  }
}

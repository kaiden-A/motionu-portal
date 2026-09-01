import { NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend'

export async function GET() {
  try {
    const data = await backendFetch<unknown>('/api/v1/events')
    return NextResponse.json(data)
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500
    const message = (e as Error).message ?? 'Events list failed'
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      title?: string
      description?: string | null
      location?: string | null
      starts_at?: string
      ends_at?: string | null
      dept?: string | null
    }
    if (!body.title || !body.starts_at) {
      return NextResponse.json({ error: 'title and starts_at are required' }, { status: 400 })
    }
    const data = await backendFetch<unknown>('/api/v1/events', {
      method: 'POST',
      body: {
        title: body.title,
        description: body.description ?? null,
        location: body.location ?? null,
        starts_at: body.starts_at,
        ends_at: body.ends_at ?? null,
        dept: body.dept ?? null,
      },
    })
    return NextResponse.json(data, { status: 201 })
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500
    const message = (e as Error).message ?? 'Create event failed'
    return NextResponse.json({ error: message }, { status })
  }
}

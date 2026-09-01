import { NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend'

export async function GET() {
  try {
    const data = await backendFetch<unknown>('/api/v1/news')
    return NextResponse.json(data)
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500
    const message = (e as Error).message ?? 'News list failed'
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      title?: string
      body?: string
      dept?: string | null
      pinned?: boolean
    }
    if (!body.title || !body.body) {
      return NextResponse.json({ error: 'title and body are required' }, { status: 400 })
    }
    const data = await backendFetch<unknown>('/api/v1/news', {
      method: 'POST',
      body: {
        title: body.title,
        body: body.body,
        dept: body.dept ?? null,
        pinned: body.pinned ?? false,
      },
    })
    return NextResponse.json(data, { status: 201 })
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500
    const message = (e as Error).message ?? 'Create news failed'
    return NextResponse.json({ error: message }, { status })
  }
}

import { NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend'

export async function GET() {
  try {
    const data = await backendFetch<unknown>('/api/v1/apps/all')
    return NextResponse.json(data)
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500
    const message = (e as Error).message ?? 'Apps list failed'
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      app_id?: string
      name?: string
      desc?: string | null
      category?: string
      dept?: string | null
      icon?: string
      url?: string | null
      enabled?: boolean
    }
    if (!body.app_id || !body.name) {
      return NextResponse.json({ error: 'app_id and name are required' }, { status: 400 })
    }
    const data = await backendFetch<unknown>('/api/v1/apps', {
      method: 'POST',
      body: {
        app_id: body.app_id,
        name: body.name,
        desc: body.desc ?? '',
        category: body.category ?? 'Internal',
        dept: body.dept ?? null,
        icon: body.icon ?? 'grid',
        url: body.url ?? '',
        enabled: body.enabled ?? true,
      },
    })
    return NextResponse.json(data, { status: 201 })
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500
    const message = (e as Error).message ?? 'Create app failed'
    return NextResponse.json({ error: message }, { status })
  }
}

import { NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend'

export async function GET() {
  try {
    const data = await backendFetch<unknown>('/api/v1/achievements')
    return NextResponse.json(data)
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500
    const message = (e as Error).message ?? 'Achievements list failed'
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { label?: string; desc?: string | null; icon?: string }
    if (!body.label) {
      return NextResponse.json({ error: 'label is required' }, { status: 400 })
    }
    const data = await backendFetch<unknown>('/api/v1/achievements', {
      method: 'POST',
      body: {
        label: body.label,
        desc: body.desc ?? null,
        icon: body.icon ?? 'star',
      },
    })
    return NextResponse.json(data, { status: 201 })
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500
    const message = (e as Error).message ?? 'Create achievement failed'
    return NextResponse.json({ error: message }, { status })
  }
}

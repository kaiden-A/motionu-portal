import { NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend'

export async function GET() {
  try {
    const data = await backendFetch<unknown>('/api/v1/users')
    return NextResponse.json(data)
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500
    const message = (e as Error).message ?? 'Users list failed'
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { name?: string; email?: string; roles?: string[] }
    if (!body.name || !body.email) {
      return NextResponse.json({ error: 'name and email are required' }, { status: 400 })
    }
    const data = await backendFetch<unknown>('/api/v1/users', {
      method: 'POST',
      body: {
        name: body.name,
        email: body.email,
        roles: body.roles ?? [],
      },
    })
    return NextResponse.json(data, { status: 201 })
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500
    const message = (e as Error).message ?? 'Create user failed'
    return NextResponse.json({ error: message }, { status })
  }
}

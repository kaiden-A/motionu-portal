import { NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.toString()
    const data = await backendFetch<unknown>(`/api/v1/memberships${q ? `?${q}` : ''}`)
    return NextResponse.json(data)
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500
    const message = (e as Error).message ?? 'List memberships failed'
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await backendFetch<unknown>('/api/v1/memberships', {
      method: 'POST',
      body,
    })
    return NextResponse.json(data, { status: 201 })
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500
    const message = (e as Error).message ?? 'Create membership failed'
    return NextResponse.json({ error: message }, { status })
  }
}

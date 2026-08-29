import { getSession } from '@/lib/session'

const API_URL = process.env.API_URL || 'http://localhost:8000'

export class BackendError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message)
    this.name = 'BackendError'
  }
}

export async function getAccessToken(): Promise<string | null> {
  const session = await getSession()
  return session?.access_token ?? null
}

/** Server-side BFF helper: forwards the user's Zitadel access token to FastAPI. */
export async function backendFetch<T = unknown>(
  path: string,
  options: { method?: string; body?: unknown; auth?: boolean } = {}
): Promise<T> {
  const { method = 'GET', body, auth = true } = options
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }

  if (auth) {
    const token = await getAccessToken()
    if (!token) {
      throw new BackendError('Not authenticated', 401)
    }
    headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  })

  let json: unknown = {}
  try {
    json = await res.json()
  } catch {
    /* non-JSON body */
  }

  if (!res.ok) {
    const message =
      (json as { detail?: string })?.detail ||
      `Backend request failed (${res.status})`
    throw new BackendError(message, res.status)
  }
  return json as T
}

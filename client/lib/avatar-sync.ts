/**
 * Zitadel avatar sync — runs inside the OIDC callback right after the
 * session is created. When the member's Google picture (captured by the
 * instance-level idp-intent webhook into our DB) differs from the last
 * picture uploaded to ZITADEL, it downloads the image and uploads it to
 * ZITADEL's avatar store (`/assets/v1/users/me/avatar`). From then on the
 * user's avatar is part of their ZITADEL identity and every other system
 * on the instance gets it via the standard OIDC `picture` claim.
 *
 * This is best-effort: any failure is logged and swallowed so login never
 * breaks because of avatar plumbing.
 */

const API_URL = process.env.API_URL || 'http://localhost:8000'
const ISSUER = process.env.ZITADEL_ISSUER
const MAX_AVATAR_BYTES = 512 * 1024

export interface AvatarSyncInfo {
  avatar_url?: string | null
  avatar_synced_url?: string | null
}

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { cache: 'no-store', ...init })
  const data = (await res.json().catch(() => ({}))) as T & { detail?: string }
  if (!res.ok) {
    throw new Error(`Avatar sync request failed (${res.status}): ${data?.detail ?? res.statusText}`)
  }
  return data
}

export async function syncZitadelAvatar(
  accessToken: string
): Promise<void> {
  if (!ISSUER || !accessToken) return

  try {
    const me = await jsonFetch<AvatarSyncInfo>(`${API_URL}/api/v1/members/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    const { avatar_url: picture, avatar_synced_url: synced } = me
    if (!picture || picture === synced) return

    // 1. Download the Google picture (server-side, capped to ZITADEL's
    //    avatar limit of 512 KiB, images only).
    const img = await fetch(picture, { signal: AbortSignal.timeout(10_000) })
    if (!img.ok) throw new Error(`Downloading avatar failed (${img.status})`)
    const contentType = img.headers.get('content-type') ?? ''
    if (!contentType.startsWith('image/')) throw new Error(`Unexpected avatar content-type: ${contentType}`)
    const bytes = await img.arrayBuffer()
    if (bytes.byteLength > MAX_AVATAR_BYTES) throw new Error(`Avatar too large (${bytes.byteLength} bytes)`)

    // 2. Upload it as the user's ZITADEL avatar.
    const form = new FormData()
    form.append('file', new Blob([bytes], { type: contentType }), 'avatar')
    const up = await fetch(`${ISSUER}/assets/v1/users/me/avatar`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: form,
      signal: AbortSignal.timeout(15_000),
    })
    if (!up.ok) throw new Error(`Uploading avatar to ZITADEL failed (${up.status})`)

    // 3. Remember what was uploaded so we don't re-upload every login.
    await jsonFetch(`${API_URL}/api/v1/members/me/avatar-sync`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ url: picture }),
    })
  } catch (e) {
    console.error('[avatar-sync]', (e as Error).message ?? e)
  }
}

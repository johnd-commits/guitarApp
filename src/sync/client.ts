/**
 * Thin GoTrue + PostgREST client. Anon key only — never the service role.
 * Project: kyetsazlzajmjaqszwej
 */
export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://kyetsazlzajmjaqszwej.supabase.co'

const SESSION_KEY = 'fretwise-supabase-session'

export type Session = {
  access_token: string
  refresh_token: string
  expires_at: number
  user: { id: string; email?: string }
}

export function anonKey(): string {
  return (
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    ''
  )
}

export function supabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && anonKey())
}

export function readSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as Session
  } catch {
    return null
  }
}

export function writeSession(session: Session | null) {
  if (!session) {
    localStorage.removeItem(SESSION_KEY)
    return
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

function headers(token?: string): HeadersInit {
  const key = anonKey()
  return {
    apikey: key,
    Authorization: `Bearer ${token || key}`,
    'Content-Type': 'application/json',
  }
}

function parseSession(payload: {
  access_token: string
  refresh_token: string
  expires_in?: number
  expires_at?: number
  user?: { id: string; email?: string }
}): Session {
  const expires_at =
    payload.expires_at ??
    Math.floor(Date.now() / 1000) + (payload.expires_in ?? 3600)
  return {
    access_token: payload.access_token,
    refresh_token: payload.refresh_token,
    expires_at,
    user: payload.user ?? { id: '' },
  }
}

/** Consume magic-link tokens from the URL hash or query. */
export function consumeAuthCallback(): Session | null {
  if (typeof window === 'undefined') return null
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const query = new URLSearchParams(window.location.search)
  const access = hash.get('access_token') ?? query.get('access_token')
  const refresh = hash.get('refresh_token') ?? query.get('refresh_token')
  if (!access || !refresh) return null
  const session = parseSession({
    access_token: access,
    refresh_token: refresh,
    expires_in: Number(hash.get('expires_in') ?? query.get('expires_in') ?? 3600),
    user: { id: hash.get('user_id') ?? '' },
  })
  writeSession(session)
  history.replaceState(null, '', window.location.pathname)
  return session
}

export async function sendMagicLink(email: string): Promise<void> {
  const redirectTo = `${window.location.origin}/settings`
  const res = await fetch(
    `${SUPABASE_URL}/auth/v1/otp?redirect_to=${encodeURIComponent(redirectTo)}`,
    {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ email, create_user: true }),
    },
  )
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Magic link failed (${res.status})`)
  }
}

export async function refreshSession(session: Session): Promise<Session> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ refresh_token: session.refresh_token }),
  })
  if (!res.ok) throw new Error('Session refresh failed')
  const next = parseSession((await res.json()) as Parameters<typeof parseSession>[0])
  writeSession(next)
  return next
}

export async function liveSession(): Promise<Session | null> {
  const fromUrl = consumeAuthCallback()
  let session = fromUrl ?? readSession()
  if (!session) return null
  const soon = Math.floor(Date.now() / 1000) + 30
  if (session.expires_at < soon) {
    try {
      session = await refreshSession(session)
    } catch {
      writeSession(null)
      return null
    }
  }
  if (!session.user.id) {
    const user = await fetchUser(session.access_token)
    if (user) {
      session = { ...session, user }
      writeSession(session)
    }
  }
  return session
}

async function fetchUser(token: string): Promise<Session['user'] | null> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: headers(token) })
  if (!res.ok) return null
  const body = (await res.json()) as { id: string; email?: string }
  return { id: body.id, email: body.email }
}

export async function signOut() {
  const session = readSession()
  if (session) {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method: 'POST',
      headers: headers(session.access_token),
    }).catch(() => undefined)
  }
  writeSession(null)
}

export async function rest<T>(
  path: string,
  init: RequestInit & { token: string },
): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      ...headers(init.token),
      Prefer: 'return=representation',
      ...(init.headers ?? {}),
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `REST ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  const text = await res.text()
  if (!text) return undefined as T
  return JSON.parse(text) as T
}

export async function uploadRecording(
  token: string,
  userId: string,
  id: string,
  blob: Blob,
  mimeType: string,
): Promise<void> {
  const path = `${userId}/${id}`
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/recordings/${path}`, {
    method: 'POST',
    headers: {
      apikey: anonKey(),
      Authorization: `Bearer ${token}`,
      'Content-Type': mimeType || 'application/octet-stream',
      'x-upsert': 'true',
    },
    body: blob,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Storage ${res.status}`)
  }
}

// Admin session helpers shared by /api functions. Files starting with "_" are not endpoints.
import { createHmac, timingSafeEqual } from 'node:crypto'

const COOKIE = 'admin_session'
export const SESSION_SECONDS = 7 * 24 * 60 * 60

function sign(value: string, secret: string) {
  return createHmac('sha256', secret).update(value).digest('base64url')
}

export function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  return ab.length === bb.length && timingSafeEqual(ab, bb)
}

/** Secret used to sign sessions. Changing ADMIN_PASSWORD logs everyone out. */
export function adminSecret(): string | null {
  const password = process.env.ADMIN_PASSWORD
  return password ? 'inbox:' + password : null
}

/** Session token = expiry time + signature. */
export function makeToken(secret: string) {
  const expires = String(Math.floor(Date.now() / 1000) + SESSION_SECONDS)
  return `${expires}.${sign(expires, secret)}`
}

export function isAdmin(request: Request): boolean {
  const secret = adminSecret()
  if (!secret) return false
  const token = (request.headers.get('cookie') ?? '')
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(COOKIE + '='))
    ?.slice(COOKIE.length + 1)
  if (!token) return false
  const [expires, signature] = token.split('.')
  if (!expires || !signature || Number(expires) < Date.now() / 1000) return false
  return safeEqual(signature, sign(expires, secret))
}

export function sessionCookie(request: Request, value: string, maxAge: number) {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : ''
  return `${COOKIE}=${value}; HttpOnly; SameSite=Strict; Path=/api; Max-Age=${maxAge}${secure}`
}

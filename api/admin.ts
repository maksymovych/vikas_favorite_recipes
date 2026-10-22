// Private inbox for contact-form messages.
// Needs ADMIN_PASSWORD (set it yourself in Vercel → Settings → Environment Variables, and in .env.local).
//
//   POST {action:'login', password}    → sets a 7-day session cookie
//   POST {action:'logout'}             → clears it
//   GET  ?action=list                  → all messages (newest first)
//   GET  ?action=photo&url=<blob url>  → streams a private photo
//   POST {action:'status', id, status} → 'new' | 'read' | 'archived'
//   POST {action:'delete', id}         → deletes the message and its photos
import { del, get } from '@vercel/blob'
import { adminSecret, isAdmin, makeToken, safeEqual, sessionCookie, SESSION_SECONDS } from './_auth'
import { BLOB_URL_RE, databaseUrl, db, ensureTable } from './_db'

const STATUSES = ['new', 'read', 'archived']

const reply = (body: object, status = 200, headers?: HeadersInit) => Response.json(body, { status, headers })

function config() {
  const password = process.env.ADMIN_PASSWORD
  const secret = adminSecret()
  const dbUrl = databaseUrl()
  if (!password || !secret || !dbUrl) return null
  return { password, secret, dbUrl }
}

export async function GET(request: Request): Promise<Response> {
  const cfg = config()
  if (!cfg) return reply({ error: 'not_configured' }, 503)
  if (!isAdmin(request)) return reply({ error: 'unauthorized' }, 401)

  const params = new URL(request.url).searchParams
  const action = params.get('action')

  if (action === 'list') {
    const sql = db(cfg.dbUrl)
    await ensureTable(sql)
    const items = await sql`SELECT * FROM submissions ORDER BY created_at DESC LIMIT 500`
    return reply({ items }, 200, { 'Cache-Control': 'no-store' })
  }

  if (action === 'photo') {
    const url = params.get('url') ?? ''
    if (!BLOB_URL_RE.test(url)) return reply({ error: 'bad_url' }, 400)
    const access = url.includes('.private.blob.') ? 'private' : 'public'
    const result = await get(url, { access })
    if (!result || result.statusCode !== 200) return reply({ error: 'not_found' }, 404)
    return new Response(result.stream, {
      headers: {
        'Content-Type': result.blob.contentType || 'image/jpeg',
        'Cache-Control': 'private, max-age=3600',
      },
    })
  }

  return reply({ error: 'unknown_action' }, 400)
}

export async function POST(request: Request): Promise<Response> {
  const cfg = config()
  if (!cfg) return reply({ error: 'not_configured' }, 503)

  let data: Record<string, unknown>
  try {
    data = (await request.json()) as Record<string, unknown>
  } catch {
    return reply({ error: 'bad_request' }, 400)
  }

  if (data.action === 'login') {
    const ok = typeof data.password === 'string' && safeEqual(data.password, cfg.password)
    if (!ok) {
      await new Promise((r) => setTimeout(r, 800)) // slow down password guessing
      return reply({ error: 'wrong_password' }, 401)
    }
    return reply({ ok: true }, 200, { 'Set-Cookie': sessionCookie(request, makeToken(cfg.secret), SESSION_SECONDS) })
  }

  if (data.action === 'logout') {
    return reply({ ok: true }, 200, { 'Set-Cookie': sessionCookie(request, '', 0) })
  }

  if (!isAdmin(request)) return reply({ error: 'unauthorized' }, 401)
  const id = Number(data.id)
  if (!Number.isInteger(id)) return reply({ error: 'bad_id' }, 400)
  const sql = db(cfg.dbUrl)

  if (data.action === 'status') {
    const status = String(data.status)
    if (!STATUSES.includes(status)) return reply({ error: 'bad_status' }, 400)
    await sql`UPDATE submissions SET status = ${status} WHERE id = ${id}`
    return reply({ ok: true })
  }

  if (data.action === 'delete') {
    const rows = (await sql`SELECT image_urls FROM submissions WHERE id = ${id}`) as { image_urls: string[] }[]
    const urls = rows[0]?.image_urls ?? []
    if (urls.length) {
      try {
        await del(urls)
      } catch (error) {
        console.error('admin: could not delete photos', error)
      }
    }
    await sql`DELETE FROM submissions WHERE id = ${id}`
    return reply({ ok: true })
  }

  return reply({ error: 'unknown_action' }, 400)
}

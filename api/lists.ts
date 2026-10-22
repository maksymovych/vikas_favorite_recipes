// Shareable checklists (shopping lists, plans for the day…), stored in the same Neon database.
//
//   GET  ?id=<id>                           → one list (public or private — private lists are only reachable by link)
//   GET  ?public=1                          → newest public lists (summary)
//   POST {action:'create', owner, description, itemsText, isPublic} → { id, editKey, list }
//   POST {action:'toggle', id, index, done} → tick / untick an item
//   POST {action:'add', id, itemsText}      → append items
//   POST {action:'delete', id, editKey}     → delete (creator's key, or a logged-in admin)
import { randomBytes } from 'node:crypto'
import { isAdmin, safeEqual } from './_auth'
import { databaseUrl, db } from './_db'

const MAX_ITEMS = 200
const MAX_ITEM_LENGTH = 200
const ID_RE = /^[A-Za-z0-9_-]{8,40}$/

type Sql = ReturnType<typeof db>
interface Item {
  text: string
  done: boolean
}
interface Row {
  id: string
  created_at: string
  updated_at: string
  owner: string
  description: string | null
  items: Item[]
  is_public: boolean
  edit_key: string
}

const reply = (body: object, status = 200) =>
  Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })

const text = (value: unknown, max: number) => (typeof value === 'string' ? value.trim().slice(0, max) : '')

/** Each line is an item; commas also start a new item. */
function parseItems(raw: unknown): Item[] {
  if (typeof raw !== 'string') return []
  return raw
    .split(/[\n,]/)
    .map((s) => s.replace(/^\s*(?:[-*•]|\d+[.)]|\[\s?[xX]?\s?\])\s*/, '').trim())
    .filter(Boolean)
    .slice(0, MAX_ITEMS)
    .map((s) => ({ text: s.slice(0, MAX_ITEM_LENGTH), done: false }))
}

/** Never send the edit key back, except to the creator right after creating. */
const publicView = ({ edit_key: _k, ...rest }: Row) => rest

async function ensureTable(sql: Sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS checklists (
      id          TEXT PRIMARY KEY,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
      owner       TEXT NOT NULL,
      description TEXT,
      items       JSONB NOT NULL DEFAULT '[]',
      is_public   BOOLEAN NOT NULL DEFAULT true,
      edit_key    TEXT NOT NULL
    )`
}

async function getList(sql: Sql, id: string) {
  const rows = (await sql`SELECT * FROM checklists WHERE id = ${id}`) as Row[]
  return rows[0]
}

export async function GET(request: Request): Promise<Response> {
  const dbUrl = databaseUrl()
  if (!dbUrl) return reply({ error: 'not_configured' }, 503)
  const sql = db(dbUrl)
  await ensureTable(sql)
  const params = new URL(request.url).searchParams

  if (params.get('public')) {
    const rows = await sql`
      SELECT id, created_at, updated_at, owner, description,
             jsonb_array_length(items) AS total,
             (SELECT count(*) FROM jsonb_array_elements(items) e WHERE (e->>'done')::boolean) AS done
      FROM checklists WHERE is_public ORDER BY updated_at DESC LIMIT 60`
    return reply({ lists: rows })
  }

  const id = params.get('id') ?? ''
  if (!ID_RE.test(id)) return reply({ error: 'not_found' }, 404)
  const list = await getList(sql, id)
  if (!list) return reply({ error: 'not_found' }, 404)
  return reply({ list: publicView(list) })
}

export async function POST(request: Request): Promise<Response> {
  const dbUrl = databaseUrl()
  if (!dbUrl) return reply({ error: 'not_configured' }, 503)

  let data: Record<string, unknown>
  try {
    data = (await request.json()) as Record<string, unknown>
  } catch {
    return reply({ error: 'bad_request' }, 400)
  }

  const sql = db(dbUrl)
  await ensureTable(sql)

  if (data.action === 'create') {
    if (text(data.website, 200)) return reply({ error: 'bad_request' }, 400) // spam trap
    const owner = text(data.owner, 60)
    const description = text(data.description, 500)
    const items = parseItems(data.itemsText)
    if (!owner) return reply({ error: 'owner' }, 400)
    if (items.length === 0) return reply({ error: 'items' }, 400)
    const id = randomBytes(9).toString('base64url') // 12 random characters — impossible to guess
    const editKey = randomBytes(18).toString('base64url')
    const isPublic = data.isPublic !== false
    const rows = (await sql`
      INSERT INTO checklists (id, owner, description, items, is_public, edit_key)
      VALUES (${id}, ${owner}, ${description || null}, ${JSON.stringify(items)}::jsonb, ${isPublic}, ${editKey})
      RETURNING *`) as Row[]
    return reply({ id, editKey, list: publicView(rows[0]) })
  }

  const id = text(data.id, 40)
  if (!ID_RE.test(id)) return reply({ error: 'not_found' }, 404)

  if (data.action === 'toggle') {
    const index = Number(data.index)
    if (!Number.isInteger(index) || index < 0 || index >= MAX_ITEMS) return reply({ error: 'bad_index' }, 400)
    const done = data.done === true
    const rows = (await sql`
      UPDATE checklists
      SET items = jsonb_set(items, ARRAY[${String(index)}, 'done'], to_jsonb(${done}::boolean)), updated_at = now()
      WHERE id = ${id} AND ${index} < jsonb_array_length(items)
      RETURNING *`) as Row[]
    if (!rows[0]) return reply({ error: 'not_found' }, 404)
    return reply({ list: publicView(rows[0]) })
  }

  if (data.action === 'add') {
    const items = parseItems(data.itemsText)
    if (items.length === 0) return reply({ error: 'items' }, 400)
    const rows = (await sql`
      UPDATE checklists
      SET items = items || ${JSON.stringify(items)}::jsonb, updated_at = now()
      WHERE id = ${id} AND jsonb_array_length(items) + ${items.length} <= ${MAX_ITEMS}
      RETURNING *`) as Row[]
    if (!rows[0]) return reply({ error: 'too_many' }, 400)
    return reply({ list: publicView(rows[0]) })
  }

  if (data.action === 'delete') {
    const list = await getList(sql, id)
    if (!list) return reply({ ok: true })
    const key = text(data.editKey, 100)
    if (!isAdmin(request) && !(key && safeEqual(key, list.edit_key))) return reply({ error: 'forbidden' }, 403)
    await sql`DELETE FROM checklists WHERE id = ${id}`
    return reply({ ok: true })
  }

  return reply({ error: 'unknown_action' }, 400)
}

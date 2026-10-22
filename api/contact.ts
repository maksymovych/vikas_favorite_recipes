// Saves a contact message (and an optional shared recipe with photos) to Postgres.
// Needs DATABASE_URL (added automatically when a Neon database is connected in Vercel).
import { BLOB_URL_RE, databaseUrl, db, ensureTable } from './_db'
import { notifyNewSubmission } from './_notify'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_IMAGES = 5

function text(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function reply(body: object, status = 200): Response {
  return Response.json(body, { status })
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

  // Hidden "website" field: real people leave it empty, spam bots fill it in
  if (text(data.website, 200)) return reply({ ok: true })

  const recipe = (typeof data.recipe === 'object' && data.recipe) || {}
  const r = recipe as Record<string, unknown>

  const entry = {
    name: text(data.name, 100),
    email: text(data.email, 200),
    message: text(data.message, 5000),
    recipeName: text(r.name, 200),
    recipeDescription: text(r.description, 2000),
    recipeIngredients: text(r.ingredients, 5000),
    recipeSteps: text(r.steps, 8000),
    images: Array.isArray(data.images)
      ? data.images.filter((u): u is string => typeof u === 'string' && BLOB_URL_RE.test(u)).slice(0, MAX_IMAGES)
      : [],
    lang: data.lang === 'uk' ? 'uk' : 'en',
  }

  if (!entry.name) return reply({ error: 'name' }, 400)
  if (!EMAIL_RE.test(entry.email)) return reply({ error: 'email' }, 400)
  if (!entry.message && !entry.recipeName && entry.images.length === 0) return reply({ error: 'empty' }, 400)

  try {
    const sql = db(dbUrl)
    await ensureTable(sql)
    const rows = (await sql`
      INSERT INTO submissions
        (name, email, message, recipe_name, recipe_description, recipe_ingredients, recipe_steps, image_urls, lang)
      VALUES
        (${entry.name}, ${entry.email}, ${entry.message || null}, ${entry.recipeName || null},
         ${entry.recipeDescription || null}, ${entry.recipeIngredients || null}, ${entry.recipeSteps || null},
         ${entry.images}, ${entry.lang})
      RETURNING id`) as { id: number }[]
    const id = rows[0]?.id
    // Email Vika about it (does nothing if email isn't set up; never blocks saving)
    await notifyNewSubmission({ id, ...entry, photoCount: entry.images.length }, new URL(request.url).origin)
    return reply({ ok: true, id })
  } catch (error) {
    console.error('contact: database error', error)
    return reply({ error: 'server' }, 500)
  }
}

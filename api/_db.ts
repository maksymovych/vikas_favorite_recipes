// Shared database helpers for the /api functions.
// Files starting with "_" are not turned into endpoints by Vercel.
import { neon } from '@neondatabase/serverless'

export function databaseUrl(): string | undefined {
  return process.env.DATABASE_URL ?? process.env.POSTGRES_URL
}

export function db(url: string) {
  return neon(url)
}

/** Creates the submissions table the first time it's needed. */
export async function ensureTable(sql: ReturnType<typeof db>) {
  await sql`
    CREATE TABLE IF NOT EXISTS submissions (
      id                 SERIAL PRIMARY KEY,
      created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
      name               TEXT NOT NULL,
      email              TEXT NOT NULL,
      message            TEXT,
      recipe_name        TEXT,
      recipe_description TEXT,
      recipe_ingredients TEXT,
      recipe_steps       TEXT,
      image_urls         TEXT[] NOT NULL DEFAULT '{}',
      lang               TEXT,
      status             TEXT NOT NULL DEFAULT 'new'
    )`
}

/** Only photo links that point to Vercel Blob storage are accepted. */
export const BLOB_URL_RE = /^https:\/\/[a-z0-9-]+\.(public|private)\.blob\.vercel-storage\.com\//i

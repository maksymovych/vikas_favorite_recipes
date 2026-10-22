// Shared types and helpers for the checklist pages.

export interface ChecklistItem {
  text: string
  done: boolean
}

export interface Checklist {
  id: string
  created_at: string
  updated_at: string
  owner: string
  description: string | null
  items: ChecklistItem[]
  is_public: boolean
}

export interface ChecklistSummary {
  id: string
  owner: string
  description: string | null
  updated_at: string
  total: number | string
  done: number | string
}

/** Same rule as the server: each line is an item, commas also split items. */
export function splitItems(text: string): string[] {
  return text
    .split(/[\n,]/)
    .map((s) => s.replace(/^\s*(?:[-*•]|\d+[.)]|\[\s?[xX]?\s?\])\s*/, '').trim())
    .filter(Boolean)
}

export async function listsApi<T>(body?: object, query?: string): Promise<{ status: number; data: T }> {
  const res = body
    ? await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    : await fetch(`/api/lists?${query ?? ''}`, { cache: 'no-store' })
  return { status: res.status, data: (await res.json().catch(() => ({}))) as T }
}

// ── Lists created in this browser (so private lists can be found again and deleted) ──

interface MyList {
  id: string
  editKey: string
  title: string
  createdAt: string
}

const KEY = 'my-checklists'

export function getMyLists(): MyList[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}

function saveMyLists(lists: MyList[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(lists))
  } catch {
    /* storage unavailable */
  }
}

export function rememberList(list: MyList) {
  saveMyLists([list, ...getMyLists().filter((l) => l.id !== list.id)].slice(0, 100))
}

export function forgetList(id: string) {
  saveMyLists(getMyLists().filter((l) => l.id !== id))
}

export function editKeyFor(id: string) {
  return getMyLists().find((l) => l.id === id)?.editKey
}

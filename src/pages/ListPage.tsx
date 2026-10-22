import { ArrowLeft, Check, Globe, Loader2, Lock, Plus, Share2, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { editKeyFor, forgetList, listsApi, splitItems, type Checklist } from '../checklists'
import { useLang } from '../i18n'
import { Progress } from './ListsPage'

const POLL_MS = 8000

export default function ListPage() {
  const { id = '' } = useParams()
  const { d } = useLang()
  const t = d.t
  const navigate = useNavigate()
  const [list, setList] = useState<Checklist | null>(null)
  const [state, setState] = useState<'loading' | 'ok' | 'missing'>('loading')
  const [newItems, setNewItems] = useState('')
  const [copied, setCopied] = useState(false)
  const [pending, setPending] = useState(0) // edits still being saved — don't let polling overwrite them
  const editKey = editKeyFor(id)

  const load = useCallback(async () => {
    try {
      const res = await listsApi<{ list?: Checklist }>(undefined, `id=${encodeURIComponent(id)}`)
      if (res.data.list) {
        setList(res.data.list)
        setState('ok')
      } else if (res.status === 404) setState('missing')
    } catch {
      /* offline — keep what we have */
    }
  }, [id])

  useEffect(() => {
    window.scrollTo(0, 0)
    setState('loading')
    load()
  }, [load])

  // Pick up changes made by others (e.g. your partner ticking things off)
  useEffect(() => {
    const tick = () => document.visibilityState === 'visible' && pending === 0 && load()
    const timer = window.setInterval(tick, POLL_MS)
    window.addEventListener('focus', tick)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', tick)
    }
  }, [load, pending])

  const title = list ? list.description || t.listOf(list.owner) : ''

  useEffect(() => {
    if (title) document.title = `${title} · ${d.lang === 'uk' ? 'Рецепти Віки' : 'Vika’s Recipes'}`
  }, [title, d.lang])

  const save = async (body: object) => {
    setPending((n) => n + 1)
    try {
      const res = await listsApi<{ list?: Checklist }>({ ...body, id })
      if (res.data.list) setList(res.data.list)
    } finally {
      setPending((n) => n - 1)
    }
  }

  const toggle = (index: number) => {
    if (!list) return
    const done = !list.items[index].done
    // Update the screen right away, then save
    setList({ ...list, items: list.items.map((it, i) => (i === index ? { ...it, done } : it)) })
    save({ action: 'toggle', index, done })
  }

  const add = (e: FormEvent) => {
    e.preventDefault()
    const items = splitItems(newItems)
    if (!list || items.length === 0) return
    setList({ ...list, items: [...list.items, ...items.map((text) => ({ text, done: false }))] })
    setNewItems('')
    save({ action: 'add', itemsText: items.join('\n') })
  }

  const share = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title, text: t.listShareText(title), url })
        return
      } catch {
        /* cancelled — fall back to copying */
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      window.prompt('', url)
    }
  }

  const remove = async () => {
    if (!window.confirm(t.listConfirmDelete)) return
    await listsApi({ action: 'delete', id, editKey })
    forgetList(id)
    navigate('/lists')
  }

  if (state === 'loading') {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <Loader2 size={32} className="animate-spin text-accent" />
      </main>
    )
  }

  if (state === 'missing' || !list) {
    return (
      <main className="mx-auto max-w-lg px-4 py-24 text-center">
        <p className="text-5xl" aria-hidden>
          📝
        </p>
        <h1 className="font-display mt-4 text-3xl font-bold text-stone-900">{t.listNotFound}</h1>
        <p className="mt-2 text-stone-600">{t.listNotFoundText}</p>
        <Link
          to="/lists"
          className="mt-6 inline-block rounded-2xl bg-accent px-6 py-3 font-semibold text-white hover:opacity-95"
        >
          {t.listBackToLists}
        </Link>
      </main>
    )
  }

  const done = list.items.filter((i) => i.done).length

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-6 flex items-center justify-between gap-3 print:hidden">
        <Link
          to="/lists"
          className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
        >
          <ArrowLeft size={18} /> {t.listBackToLists}
        </Link>
        <button
          type="button"
          onClick={share}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-md shadow-teal-700/20 transition hover:opacity-95"
        >
          {copied ? <Check size={17} /> : <Share2 size={17} />} {copied ? t.listCopied : t.listShare}
        </button>
      </div>

      <div className="rounded-3xl border border-stone-200/70 bg-surface p-5 shadow-xl shadow-teal-900/5 sm:p-8">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl leading-tight font-bold text-stone-900 sm:text-4xl">{title}</h1>
            <p className="mt-1 text-stone-500">{t.listBy(list.owner)}</p>
          </div>
          <span
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
              list.is_public ? 'bg-accent-soft text-accent' : 'bg-stone-200 text-stone-700'
            }`}
          >
            {list.is_public ? <Globe size={13} /> : <Lock size={13} />}
            {list.is_public ? t.listPublic : t.listPrivate}
          </span>
        </div>

        <div className="mt-5">
          <Progress done={done} total={list.items.length} />
          <p className="mt-1.5 text-sm text-stone-500">{t.listProgress(done, list.items.length)}</p>
        </div>

        <ul className="mt-6 divide-y divide-stone-200/70">
          {list.items.map((item, i) => (
            <li key={i}>
              <label className="flex items-center gap-4 rounded-xl px-2 py-3.5 transition hover:bg-stone-50">
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={() => toggle(i)}
                  className="h-6 w-6 shrink-0 rounded-md accent-[var(--color-accent)]"
                />
                <span
                  className={`text-lg transition ${item.done ? 'text-stone-400 line-through' : 'text-stone-800'}`}
                >
                  {item.text}
                </span>
              </label>
            </li>
          ))}
        </ul>

        <form onSubmit={add} className="mt-4 flex gap-2 print:hidden">
          <input
            value={newItems}
            onChange={(e) => setNewItems(e.target.value)}
            placeholder={t.listAddItems}
            className="flex-1 rounded-xl border border-stone-200 bg-surface px-4 py-3 text-stone-800 outline-none placeholder:text-stone-400 focus:border-accent focus:ring-4 focus:ring-accent/15"
          />
          <button
            type="submit"
            disabled={!newItems.trim()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 font-semibold text-white disabled:opacity-50"
          >
            <Plus size={18} /> {t.listAdd}
          </button>
        </form>
        <p className="mt-3 text-xs text-stone-500 print:hidden">{t.listLiveHint}</p>
      </div>

      {editKey && (
        <div className="mt-6 text-center print:hidden">
          <button
            type="button"
            onClick={remove}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50 dark:hover:bg-rose-950/40"
          >
            <Trash2 size={16} /> {t.listDelete}
          </button>
        </div>
      )}
    </main>
  )
}

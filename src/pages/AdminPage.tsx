import {
  Archive,
  ArchiveRestore,
  ChefHat,
  Inbox,
  Loader2,
  LockKeyhole,
  LogOut,
  Mail,
  MailOpen,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { useLang } from '../i18n'

interface Submission {
  id: number
  created_at: string
  name: string
  email: string
  message: string | null
  recipe_name: string | null
  recipe_description: string | null
  recipe_ingredients: string | null
  recipe_steps: string | null
  image_urls: string[]
  lang: string | null
  status: 'new' | 'read' | 'archived'
}

type View = 'loading' | 'login' | 'not_configured' | 'inbox'
type Tab = 'new' | 'all' | 'archived'

const photoSrc = (url: string) => `/api/admin?action=photo&url=${encodeURIComponent(url)}`

async function api(body: object) {
  const res = await fetch('/api/admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return { status: res.status, body: (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string } }
}

export default function AdminPage() {
  const { d } = useLang()
  const t = d.t
  const [view, setView] = useState<View>('loading')
  const [items, setItems] = useState<Submission[]>([])
  const [tab, setTab] = useState<Tab>('new')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [busy, setBusy] = useState(false)

  // Keep the inbox out of search engines
  useEffect(() => {
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex, nofollow'
    document.head.appendChild(meta)
    document.title = `${t.adminTitle} · ${d.lang === 'uk' ? 'Рецепти Віки' : 'Vika’s Recipes'}`
    return () => meta.remove()
  }, [t.adminTitle, d.lang])

  const load = useCallback(async () => {
    setBusy(true)
    try {
      const res = await fetch('/api/admin?action=list', { cache: 'no-store' })
      if (res.status === 401) return setView('login')
      if (res.status === 503) return setView('not_configured')
      const body = (await res.json()) as { items?: Submission[] }
      setItems(body.items ?? [])
      setView('inbox')
    } catch {
      setView('not_configured')
    } finally {
      setBusy(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const login = async (e: FormEvent) => {
    e.preventDefault()
    setLoginError('')
    setBusy(true)
    const res = await api({ action: 'login', password })
    setBusy(false)
    if (res.body.ok) {
      setPassword('')
      load()
    } else setLoginError(res.status === 503 ? t.adminNotConfigured : t.adminWrongPassword)
  }

  const logout = async () => {
    await api({ action: 'logout' })
    setItems([])
    setView('login')
  }

  const setStatus = async (id: number, status: Submission['status']) => {
    setItems((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)))
    await api({ action: 'status', id, status })
  }

  const remove = async (id: number) => {
    if (!window.confirm(t.adminConfirmDelete)) return
    setItems((prev) => prev.filter((s) => s.id !== id))
    await api({ action: 'delete', id })
  }

  const counts = useMemo(
    () => ({
      new: items.filter((s) => s.status === 'new').length,
      all: items.filter((s) => s.status !== 'archived').length,
      archived: items.filter((s) => s.status === 'archived').length,
    }),
    [items],
  )

  const shown = items.filter((s) =>
    tab === 'new' ? s.status === 'new' : tab === 'archived' ? s.status === 'archived' : s.status !== 'archived',
  )

  const date = (iso: string) =>
    new Intl.DateTimeFormat(d.lang === 'uk' ? 'uk-UA' : 'en-CA', { dateStyle: 'medium', timeStyle: 'short' }).format(
      new Date(iso),
    )

  if (view === 'loading') {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <Loader2 size={32} className="animate-spin text-accent" />
      </main>
    )
  }

  if (view === 'not_configured') {
    return (
      <main className="mx-auto max-w-lg px-4 py-24 text-center">
        <LockKeyhole size={44} className="mx-auto text-accent" />
        <p className="mt-4 text-stone-700">{t.adminNotConfigured}</p>
      </main>
    )
  }

  if (view === 'login') {
    return (
      <main className="mx-auto max-w-md px-4 py-20 sm:py-28">
        <form
          onSubmit={login}
          className="rounded-3xl border border-stone-200/70 bg-surface p-6 shadow-xl shadow-teal-900/5 sm:p-8"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
            <LockKeyhole size={24} />
          </span>
          <h1 className="font-display mt-4 text-3xl font-bold text-stone-900">{t.adminLoginTitle}</h1>
          <p className="mt-2 text-stone-600">{t.adminLoginText}</p>
          <label className="mt-6 block">
            <span className="mb-1.5 block text-sm font-semibold text-stone-800">{t.adminPassword}</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              autoFocus
              className="w-full rounded-xl border border-stone-200 bg-surface px-4 py-3 text-stone-800 outline-none focus:border-accent focus:ring-4 focus:ring-accent/15"
            />
          </label>
          {loginError && (
            <p role="alert" className="mt-3 text-sm text-rose-600">
              {loginError}
            </p>
          )}
          <button
            type="submit"
            disabled={busy || !password}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-accent px-6 py-3.5 font-semibold text-white shadow-md disabled:opacity-60"
          >
            {busy && <Loader2 size={18} className="animate-spin" />} {t.adminLogin}
          </button>
        </form>
      </main>
    )
  }

  const statusLabel = { new: t.adminStatusNew, read: t.adminStatusRead, archived: t.adminStatusArchived }
  const actionBtn =
    'inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-surface px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100'

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display flex items-center gap-3 text-4xl font-bold text-stone-900">
            <Inbox size={34} className="text-accent" /> {t.adminTitle}
          </h1>
          <p className="mt-1 text-stone-500">{t.adminCount(items.length)}</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={load} className={actionBtn} disabled={busy}>
            <RefreshCw size={16} className={busy ? 'animate-spin' : ''} /> {t.adminRefresh}
          </button>
          <button type="button" onClick={logout} className={actionBtn}>
            <LogOut size={16} /> {t.adminLogout}
          </button>
        </div>
      </div>

      <div className="mt-6 flex gap-2 border-b border-stone-200" role="tablist">
        {(['new', 'all', 'archived'] as Tab[]).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
              tab === key ? 'border-accent text-accent' : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            {{ new: t.adminTabNew, all: t.adminTabAll, archived: t.adminTabArchived }[key]}
            <span
              className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                tab === key ? 'bg-accent text-white' : 'bg-stone-200 text-stone-600'
              }`}
            >
              {counts[key]}
            </span>
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="py-20 text-center text-stone-500">{t.adminEmpty}</p>
      ) : (
        <ul className="mt-6 space-y-5">
          {shown.map((s) => {
            const hasRecipe =
              s.recipe_name || s.recipe_description || s.recipe_ingredients || s.recipe_steps || s.image_urls.length > 0
            return (
              <li
                key={s.id}
                className={`rounded-3xl border bg-surface p-5 shadow-sm sm:p-6 ${
                  s.status === 'new' ? 'border-accent/50 ring-1 ring-accent/30' : 'border-stone-200/70'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-soft text-lg font-bold text-accent">
                      {s.name.trim().charAt(0).toUpperCase() || '?'}
                    </span>
                    <div>
                      <p className="font-semibold text-stone-900">{s.name}</p>
                      <a href={`mailto:${s.email}`} className="text-sm text-accent hover:underline">
                        {s.email}
                      </a>
                    </div>
                  </div>
                  <div className="text-right text-sm text-stone-500">
                    <p>{date(s.created_at)}</p>
                    <p className="mt-1 flex items-center justify-end gap-2">
                      {s.lang && <span className="uppercase">{s.lang}</span>}
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          s.status === 'new'
                            ? 'bg-accent text-white'
                            : s.status === 'archived'
                              ? 'bg-stone-200 text-stone-600'
                              : 'bg-accent-soft text-accent'
                        }`}
                      >
                        {statusLabel[s.status]}
                      </span>
                    </p>
                  </div>
                </div>

                {s.message && <p className="mt-4 whitespace-pre-wrap text-stone-800">{s.message}</p>}

                {hasRecipe && (
                  <div className="mt-4 rounded-2xl bg-accent-soft/50 p-4">
                    <p className="flex items-center gap-2 text-xs font-semibold tracking-wider text-accent uppercase">
                      <ChefHat size={16} /> {t.adminRecipe}
                    </p>
                    {s.recipe_name && (
                      <p className="font-display mt-2 text-xl font-bold text-stone-900">{s.recipe_name}</p>
                    )}
                    {s.recipe_description && <p className="mt-1 text-stone-700">{s.recipe_description}</p>}
                    {(s.recipe_ingredients || s.recipe_steps) && (
                      <div className="mt-3 grid gap-4 sm:grid-cols-2">
                        {s.recipe_ingredients && (
                          <div>
                            <p className="text-sm font-semibold text-stone-800">{t.fIngredients}</p>
                            <p className="mt-1 text-sm whitespace-pre-wrap text-stone-700">{s.recipe_ingredients}</p>
                          </div>
                        )}
                        {s.recipe_steps && (
                          <div>
                            <p className="text-sm font-semibold text-stone-800">{t.fSteps}</p>
                            <p className="mt-1 text-sm whitespace-pre-wrap text-stone-700">{s.recipe_steps}</p>
                          </div>
                        )}
                      </div>
                    )}
                    {s.image_urls.length > 0 && (
                      <>
                        <ul className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
                          {s.image_urls.map((url) => (
                            <li key={url}>
                              <a href={photoSrc(url)} target="_blank" rel="noreferrer">
                                <img
                                  src={photoSrc(url)}
                                  alt=""
                                  loading="lazy"
                                  className="aspect-square w-full rounded-xl object-cover ring-1 ring-black/5 transition hover:opacity-90"
                                />
                              </a>
                            </li>
                          ))}
                        </ul>
                        <p className="mt-2 text-xs text-stone-500">{t.adminPhotoHint}</p>
                      </>
                    )}
                  </div>
                )}

                <div className="mt-5 flex flex-wrap gap-2">
                  <a
                    href={`mailto:${s.email}?subject=${encodeURIComponent(
                      s.recipe_name ? `Re: ${s.recipe_name}` : 'Re: Vika’s Recipes',
                    )}`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-3 py-2 text-sm font-semibold text-white hover:opacity-90"
                  >
                    <Mail size={16} /> {t.adminReply}
                  </a>
                  {s.status === 'new' ? (
                    <button type="button" className={actionBtn} onClick={() => setStatus(s.id, 'read')}>
                      <MailOpen size={16} /> {t.adminMarkRead}
                    </button>
                  ) : s.status === 'read' ? (
                    <button type="button" className={actionBtn} onClick={() => setStatus(s.id, 'new')}>
                      <Mail size={16} /> {t.adminMarkNew}
                    </button>
                  ) : null}
                  {s.status === 'archived' ? (
                    <button type="button" className={actionBtn} onClick={() => setStatus(s.id, 'read')}>
                      <ArchiveRestore size={16} /> {t.adminRestore}
                    </button>
                  ) : (
                    <button type="button" className={actionBtn} onClick={() => setStatus(s.id, 'archived')}>
                      <Archive size={16} /> {t.adminArchive}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => remove(s.id)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50 dark:border-rose-900 dark:hover:bg-rose-950/40"
                  >
                    <Trash2 size={16} /> {t.adminDelete}
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}

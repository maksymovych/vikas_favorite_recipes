import { Globe, ListChecks, Loader2, Lock, Plus } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import {
  getMyLists,
  listsApi,
  rememberList,
  splitItems,
  type Checklist,
  type ChecklistSummary,
} from '../checklists'
import { useLang } from '../i18n'

const inputCls =
  'w-full rounded-xl border border-stone-200 bg-surface px-4 py-3 text-stone-800 shadow-sm outline-none placeholder:text-stone-400 focus:border-accent focus:ring-4 focus:ring-accent/15'

function Progress({ done, total }: { done: number; total: number }) {
  const pct = total ? Math.round((done / total) * 100) : 0
  return (
    <div className="h-2 overflow-hidden rounded-full bg-stone-200">
      <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
    </div>
  )
}

export default function ListsPage() {
  const { d } = useLang()
  const t = d.t
  const navigate = useNavigate()

  const [owner, setOwner] = useState(() => {
    try {
      return localStorage.getItem('checklist-owner') ?? ''
    } catch {
      return ''
    }
  })
  const [description, setDescription] = useState('')
  const [itemsText, setItemsText] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [website, setWebsite] = useState('') // spam trap
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [publicLists, setPublicLists] = useState<ChecklistSummary[] | null>(null)
  const myLists = useMemo(() => getMyLists(), [])
  const preview = useMemo(() => splitItems(itemsText), [itemsText])

  useEffect(() => {
    window.scrollTo(0, 0)
    document.title = `${t.listsTitle} · ${d.lang === 'uk' ? 'Рецепти Віки' : 'Vika’s Recipes'}`
  }, [t.listsTitle, d.lang])

  useEffect(() => {
    listsApi<{ lists?: ChecklistSummary[] }>(undefined, 'public=1')
      .then((r) => setPublicLists(r.data.lists ?? []))
      .catch(() => setPublicLists([]))
  }, [])

  const create = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!owner.trim()) return setError(t.listErrOwner)
    if (preview.length === 0) return setError(t.listErrItems)
    setBusy(true)
    try {
      const res = await listsApi<{ id?: string; editKey?: string; list?: Checklist; error?: string }>({
        action: 'create',
        owner,
        description,
        itemsText,
        isPublic,
        website,
      })
      if (!res.data.id || !res.data.editKey) {
        setBusy(false)
        return setError(res.data.error === 'not_configured' ? t.errNotConfigured : t.errGeneric)
      }
      try {
        localStorage.setItem('checklist-owner', owner.trim())
      } catch {
        /* storage unavailable */
      }
      rememberList({
        id: res.data.id,
        editKey: res.data.editKey,
        title: description.trim() || t.listOf(owner.trim()),
        createdAt: new Date().toISOString(),
      })
      navigate(`/list/${res.data.id}`)
    } catch {
      setBusy(false)
      setError(t.errGeneric)
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:gap-14">
        {/* Intro + lists */}
        <section>
          <p className="text-xs font-semibold tracking-[0.14em] text-accent uppercase sm:text-sm">{t.listsEyebrow}</p>
          <h1 className="font-display mt-3 text-4xl leading-tight font-extrabold text-stone-900 sm:text-5xl">
            {t.listsTitle}
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-stone-600">{t.listsIntro}</p>

          {myLists.length > 0 && (
            <div className="mt-10">
              <h2 className="mb-3 text-xs font-semibold tracking-[0.12em] text-accent uppercase">{t.listMine}</h2>
              <ul className="space-y-2">
                {myLists.map((l) => (
                  <li key={l.id}>
                    <Link
                      to={`/list/${l.id}`}
                      className="flex items-center gap-3 rounded-2xl border border-stone-200/70 bg-surface px-4 py-3 transition hover:border-accent hover:shadow-sm"
                    >
                      <ListChecks size={20} className="shrink-0 text-accent" />
                      <span className="flex-1 truncate font-medium text-stone-800">{l.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* Create form */}
        <form
          onSubmit={create}
          noValidate
          className="space-y-5 rounded-3xl border border-stone-200/70 bg-surface p-5 shadow-xl shadow-teal-900/5 sm:p-8"
        >
          <h2 className="font-display flex items-center gap-2 text-2xl font-bold text-stone-900">
            <Plus size={24} className="text-accent" /> {t.listNew}
          </h2>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-stone-800">{t.listOwner}</span>
            <input className={inputCls} value={owner} onChange={(e) => setOwner(e.target.value)} maxLength={60} />
          </label>

          <label className="block">
            <span className="mb-1.5 flex items-baseline gap-2 text-sm font-semibold text-stone-800">
              {t.listDescription} <span className="text-xs font-normal text-stone-400">({t.fOptional})</span>
            </span>
            <input
              className={inputCls}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t.listDescriptionPlaceholder}
              maxLength={500}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 flex items-baseline justify-between gap-2 text-sm font-semibold text-stone-800">
              {t.listItems}
              {preview.length > 0 && (
                <span className="text-xs font-medium text-accent">{t.listItemCount(preview.length)}</span>
              )}
            </span>
            <textarea
              className={`${inputCls} min-h-40 resize-y`}
              value={itemsText}
              onChange={(e) => setItemsText(e.target.value)}
              placeholder={t.listItemsPlaceholder.replace(/\\n/g, '\n')}
            />
            <span className="mt-1 block text-xs text-stone-500">{t.listItemsHint}</span>
          </label>

          {/* Live preview of the checkboxes */}
          {preview.length > 0 && (
            <ul className="max-h-48 space-y-1.5 overflow-y-auto rounded-2xl bg-accent-soft/50 p-4">
              {preview.slice(0, 50).map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-stone-700">
                  <span className="h-4 w-4 shrink-0 rounded border-2 border-accent/60" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          )}

          {/* Public / private */}
          <div>
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-stone-100 p-1">
              {[true, false].map((pub) => (
                <button
                  key={String(pub)}
                  type="button"
                  onClick={() => setIsPublic(pub)}
                  aria-pressed={isPublic === pub}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition ${
                    isPublic === pub ? 'bg-surface text-accent shadow-sm' : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  {pub ? <Globe size={16} /> : <Lock size={16} />} {pub ? t.listPublic : t.listPrivate}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-stone-500">{isPublic ? t.listPublicHint : t.listPrivateHint}</p>
          </div>

          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className="hidden"
            aria-hidden
          />

          {error && (
            <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-200">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-accent px-6 py-4 font-semibold text-white shadow-md shadow-teal-700/20 transition hover:-translate-y-0.5 hover:shadow-lg disabled:translate-y-0 disabled:opacity-70"
          >
            {busy ? <Loader2 size={18} className="animate-spin" /> : <ListChecks size={18} />}
            {busy ? t.listCreating : t.listCreate}
          </button>
        </form>
      </div>

      {/* Public lists */}
      <section className="mt-16">
        <h2 className="font-display mb-5 text-3xl font-bold text-stone-900">{t.listPublicLists}</h2>
        {publicLists === null ? (
          <Loader2 size={24} className="animate-spin text-accent" />
        ) : publicLists.length === 0 ? (
          <p className="text-stone-500">{t.listNoPublic}</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {publicLists.map((l) => {
              const done = Number(l.done)
              const total = Number(l.total)
              return (
                <li key={l.id}>
                  <Link
                    to={`/list/${l.id}`}
                    className="block h-full rounded-2xl border border-stone-200/70 bg-surface p-5 transition hover:-translate-y-0.5 hover:border-accent hover:shadow-md"
                  >
                    <p className="font-display text-lg font-bold text-stone-900">{l.description || t.listOf(l.owner)}</p>
                    <p className="mt-0.5 text-sm text-stone-500">{t.listBy(l.owner)}</p>
                    <div className="mt-4">
                      <Progress done={done} total={total} />
                      <p className="mt-1.5 text-xs text-stone-500">{t.listProgress(done, total)}</p>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </main>
  )
}

export { Progress }

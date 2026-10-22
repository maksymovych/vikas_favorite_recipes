import { ArrowLeft, Clock, Printer, Signal } from 'lucide-react'
import { useEffect, useLayoutEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { FavoriteButton } from '../components/RecipeCard'
import { photos } from '../data/photos'
import { recipes } from '../data/recipes'
import { useLang } from '../i18n'
import { localizeRecipe } from '../localize'
import { CATEGORY_ICONS, SEASON_ICONS } from '../types'

export default function RecipePage() {
  const { id } = useParams()
  const { d } = useLang()
  const navigate = useNavigate()
  const location = useLocation()
  const [checked, setChecked] = useState<Set<number>>(new Set())

  const base = recipes.find((r) => r.id === id)
  const recipe = base && localizeRecipe(base, d)
  const photo = id ? photos[id] : undefined

  // Start each recipe at the top and with a fresh checklist
  useLayoutEffect(() => {
    window.scrollTo(0, 0)
    setChecked(new Set())
  }, [id])

  useEffect(() => {
    if (recipe) document.title = `${recipe.title} · ${d.lang === 'uk' ? 'Рецепти Віки' : 'Vika’s Recipes'}`
  }, [recipe, d.lang])

  // Always print in the light theme
  useEffect(() => {
    let wasDark = false
    const before = () => {
      wasDark = document.documentElement.classList.contains('dark')
      document.documentElement.classList.remove('dark')
    }
    const after = () => wasDark && document.documentElement.classList.add('dark')
    window.addEventListener('beforeprint', before)
    window.addEventListener('afterprint', after)
    return () => {
      window.removeEventListener('beforeprint', before)
      window.removeEventListener('afterprint', after)
    }
  }, [])

  // Go back to the list (keeping filters & scroll) if we came from it, otherwise open the home page
  const goBack = () => (location.key !== 'default' ? navigate(-1) : navigate('/'))

  const toggle = (i: number) =>
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })

  if (!recipe) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <p className="text-6xl" aria-hidden>
          🍳
        </p>
        <h1 className="font-display mt-4 text-3xl font-bold text-stone-900">{d.t.notFound}</h1>
        <p className="mt-2 text-stone-600">{d.t.notFoundText}</p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-xl bg-accent px-5 py-2.5 font-medium text-white hover:opacity-90"
        >
          {d.t.back}
        </Link>
      </div>
    )
  }

  return (
    <article className="mx-auto max-w-5xl px-4 pt-4 pb-16 sm:px-6 lg:px-8 print:max-w-none print:p-0">
      {/* Toolbar */}
      <div className="mb-4 flex items-center justify-between gap-3 print:hidden">
        <button
          type="button"
          onClick={goBack}
          className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
        >
          <ArrowLeft size={18} /> {d.t.back}
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-surface px-4 py-2 text-sm font-medium text-stone-800 shadow-sm transition hover:bg-stone-100"
        >
          <Printer size={17} /> {d.t.print}
        </button>
      </div>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-teal-50 to-cyan-100 shadow-2xl shadow-teal-900/10 dark:from-stone-200 dark:to-stone-300 print:hidden">
        <div className="aspect-[4/3] sm:aspect-[21/9]">
          {photo ? (
            <img src={photo.src} alt={recipe.title} className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full items-center justify-center text-8xl" aria-hidden>
              {recipe.emoji}
            </span>
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
        <FavoriteButton id={recipe.id} className="absolute top-4 right-4 h-11 w-11" />
        <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-8">
          <p className="text-xs font-semibold tracking-[0.14em] text-white/80 uppercase">
            {d.cuisine(recipe.cuisine)} · {d.category(recipe.categories[0])}
          </p>
          <h1 className="font-display mt-1 text-3xl leading-tight font-extrabold drop-shadow sm:text-5xl">{recipe.title}</h1>
          <p className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-white/90 sm:text-base">
            <span className="inline-flex items-center gap-1.5">
              <Clock size={16} /> {d.time(recipe.prepMinutes + recipe.cookMinutes)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Signal size={16} /> {d.difficulty(recipe.difficulty)}
            </span>
          </p>
        </div>
      </div>
      {photo && (
        <p className="mt-2 text-right text-[11px] text-stone-400 print:hidden">
          {d.t.photo}:{' '}
          <a href={photo.sourceUrl} target="_blank" rel="noreferrer" className="underline hover:text-stone-600">
            {photo.author}
          </a>
          {photo.license && ` · ${photo.license}`} · Wikimedia Commons
        </p>
      )}

      {/* Title */}
      <header className="mt-4 sm:mt-6 print:mt-0">
        <div className="hidden print:block">
          <p className="text-xs font-semibold tracking-wider text-stone-600 uppercase">
            {d.cuisine(recipe.cuisine)} · {d.category(recipe.categories[0])}
          </p>
          <h1 className="font-display mt-1 text-3xl leading-tight font-bold text-stone-900">{recipe.title}</h1>
        </div>
        {recipe.credit && <p className="mt-1 text-stone-600 italic">{recipe.credit}</p>}
        <p className="mt-3 max-w-3xl text-lg text-stone-700 print:text-base">{recipe.description}</p>
      </header>

      <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 print:mt-4 print:flex print:gap-6">
        {[
          [d.t.prep, d.time(recipe.prepMinutes)],
          [d.t.cook, recipe.cookMinutes ? d.time(recipe.cookMinutes) : d.t.noCooking],
          [d.t.serves, recipe.servings],
          [d.t.difficulty, d.difficulty(recipe.difficulty)],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl border border-stone-200/70 bg-surface px-4 py-3 print:rounded-none print:border-0 print:bg-transparent print:p-0 print:shadow-none"
          >
            <dt className="text-xs text-stone-500">{label}</dt>
            <dd className="font-semibold text-stone-800">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 flex flex-wrap gap-2 print:hidden">
        {recipe.categories.map((c) => (
          <span key={c} className="rounded-full bg-surface px-3 py-1 text-sm text-stone-700 shadow-sm">
            {CATEGORY_ICONS[c]} {d.category(c)}
          </span>
        ))}
        {recipe.seasons.map((s) => (
          <span key={s} className="rounded-full bg-surface px-3 py-1 text-sm text-stone-700 shadow-sm">
            {SEASON_ICONS[s]} {d.season(s)}
          </span>
        ))}
      </div>

      <div className="mt-10 grid gap-10 md:grid-cols-[2fr_3fr] print:mt-6 print:grid-cols-[2fr_3fr] print:gap-8">
        <section className="md:sticky md:top-24 md:self-start print:static">
          <div className="rounded-3xl border border-stone-200/70 bg-surface p-5 shadow-sm sm:p-6 print:rounded-none print:border-0 print:bg-transparent print:p-0 print:shadow-none">
            <h2 className="font-display mb-3 text-2xl font-semibold text-stone-900 print:text-xl">{d.t.ingredients}</h2>
            <ul className="space-y-1">
              {recipe.ingredients.map((ing, i) => (
                <li key={i} className="break-inside-avoid">
                  <label className="flex items-start gap-3 rounded-lg px-2 py-1.5 hover:bg-stone-100 print:px-0 print:py-0.5">
                    <input
                      type="checkbox"
                      checked={checked.has(i)}
                      onChange={() => toggle(i)}
                      className="mt-1 h-4 w-4 shrink-0 accent-olive"
                    />
                    <span
                      className={
                        checked.has(i) ? 'text-stone-400 line-through print:text-stone-800 print:no-underline' : 'text-stone-800'
                      }
                    >
                      <span className="font-semibold">{ing.amount}</span> {ing.label}
                      {ing.note && <span className="text-stone-500"> — {ing.note}</span>}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section>
          <h2 className="font-display mb-4 text-2xl font-semibold text-stone-900 print:text-xl">{d.t.method}</h2>
          <ol className="space-y-5 print:space-y-3">
            {recipe.steps.map((step, i) => (
              <li key={i} className="flex gap-4 break-inside-avoid">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white print:h-6 print:w-6 print:border print:border-stone-800 print:bg-transparent print:text-stone-900">
                  {i + 1}
                </span>
                <p className="pt-1 leading-relaxed text-stone-800 print:pt-0">{step}</p>
              </li>
            ))}
          </ol>

          {recipe.tips && recipe.tips.length > 0 && (
            <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 break-inside-avoid dark:border-amber-900/60 dark:bg-amber-950/40 print:mt-5 print:bg-transparent print:p-3">
              <h3 className="mb-1 font-semibold text-amber-900 dark:text-amber-200">💡 {d.t.tips}</h3>
              <ul className="list-disc space-y-1 pl-5 text-amber-900 dark:text-amber-100">
                {recipe.tips.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>

      <p className="mt-10 hidden border-t border-stone-300 pt-3 text-xs text-stone-500 print:block">
        {d.lang === 'uk' ? 'Рецепти Віки' : 'Vika’s Recipes'} · {window.location.href}
      </p>
    </article>
  )
}

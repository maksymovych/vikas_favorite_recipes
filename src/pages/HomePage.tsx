import { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { useNavigationType } from 'react-router'
import CategoryBar from '../components/CategoryBar'
import Filters from '../components/Filters'
import RecipeCard from '../components/RecipeCard'
import { recipes } from '../data/recipes'
import { useLang } from '../i18n'
import { localizeRecipe } from '../localize'
import { CATEGORIES, CUISINES, SEASONS } from '../types'
import type { FilterState } from '../useFilters'

const DIFFICULTY_RANK = { Easy: 0, Medium: 1, Hard: 2 }

function countBy<K extends string>(keys: readonly K[], getKeys: (r: (typeof recipes)[number]) => K[]) {
  const counts = Object.fromEntries(keys.map((k) => [k, 0])) as Record<K, number>
  for (const r of recipes) for (const k of getKeys(r)) counts[k]++
  return counts
}

const categoryCounts = countBy(CATEGORIES, (r) => r.categories)
const seasonCounts = countBy(SEASONS, (r) => r.seasons)
const cuisineCounts = countBy(CUISINES, (r) => [r.cuisine])

const allIngredients = (() => {
  const counts = new Map<string, number>()
  for (const r of recipes)
    for (const name of new Set(r.ingredients.map((i) => i.name))) counts.set(name, (counts.get(name) ?? 0) + 1)
  return [...counts]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
})()

/** Scroll position of the list, so "Back" from a recipe returns to the same spot. */
let savedScroll = 0

interface Props {
  f: FilterState
  drawerOpen: boolean
  setDrawerOpen: (open: boolean) => void
}

export default function HomePage({ f, drawerOpen, setDrawerOpen }: Props) {
  const { d } = useLang()
  const navigationType = useNavigationType()
  const [sort, setSort] = useState<'az' | 'quickest' | 'easiest'>('az')

  useLayoutEffect(() => {
    window.scrollTo(0, navigationType === 'POP' ? savedScroll : 0)
    document.title = d.lang === 'uk' ? 'Рецепти Віки' : 'Vika’s Recipes'
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    document.title = d.lang === 'uk' ? 'Рецепти Віки' : 'Vika’s Recipes'
  }, [d.lang])

  // Close the mobile drawer automatically when the screen grows to desktop size
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const onChange = () => mq.matches && setDrawerOpen(false)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [setDrawerOpen])

  const localized = useMemo(() => recipes.map((r) => localizeRecipe(r, d)), [d])

  const filtered = useMemo(() => {
    const q = f.query.trim().toLowerCase()
    const result = localized.filter((r, idx) => {
      if (f.category && !r.categories.includes(f.category)) return false
      if (f.seasons.length && !f.seasons.some((s) => r.seasons.includes(s))) return false
      if (f.cuisines.length && !f.cuisines.includes(r.cuisine)) return false
      if (f.ingredients.length && !f.ingredients.every((name) => r.ingredients.some((i) => i.name === name)))
        return false
      if (q) {
        // Search both languages so "борщ" and "borscht" both work
        const haystack = [
          r.title,
          recipes[idx].title,
          r.description,
          r.cuisine,
          d.cuisine(r.cuisine),
          ...r.categories.flatMap((c) => [c, d.category(c)]),
          ...r.seasons.flatMap((s) => [s, d.season(s)]),
          ...r.ingredients.flatMap((i) => [i.name, i.label]),
        ]
          .join(' ')
          .toLowerCase()
        if (!q.split(/\s+/).every((word) => haystack.includes(word))) return false
      }
      return true
    })
    return result.sort((a, b) => {
      if (sort === 'quickest') return a.prepMinutes + a.cookMinutes - (b.prepMinutes + b.cookMinutes)
      if (sort === 'easiest') return DIFFICULTY_RANK[a.difficulty] - DIFFICULTY_RANK[b.difficulty]
      return a.title.localeCompare(b.title, d.lang)
    })
  }, [localized, f, sort, d])

  const filters = (
    <Filters
      seasons={f.seasons}
      onToggleSeason={f.toggleSeason}
      seasonCounts={seasonCounts}
      cuisines={f.cuisines}
      onToggleCuisine={f.toggleCuisine}
      cuisineCounts={cuisineCounts}
      ingredients={f.ingredients}
      onToggleIngredient={f.toggleIngredient}
      allIngredients={allIngredients}
      onClear={f.clearAll}
      hasActiveFilters={f.hasActiveFilters}
    />
  )

  return (
    <>
      <main className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <section className="py-6 sm:py-10">
          <h1 className="font-display max-w-2xl text-3xl leading-tight font-bold text-stone-900 sm:text-4xl lg:text-5xl">
            {d.t.heroTitle}
          </h1>
          <p className="mt-3 max-w-xl text-stone-600 sm:text-lg">{d.t.heroText}</p>
        </section>

        <CategoryBar value={f.category} onChange={f.setCategory} counts={categoryCounts} />

        <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-10">
          <aside className="hidden lg:block">
            <div className="no-scrollbar sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto pb-4">{filters}</div>
          </aside>

          <section aria-live="polite">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-stone-600">
                <span className="font-semibold text-stone-900">{filtered.length}</span> {d.t.recipes(filtered.length)}
              </p>
              <label className="flex items-center gap-2 text-sm text-stone-600">
                {d.t.sort}
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as typeof sort)}
                  className="rounded-xl border border-stone-200 bg-surface px-2.5 py-1.5 text-sm text-stone-800 outline-none focus:border-terracotta"
                >
                  <option value="az">{d.t.sortAz}</option>
                  <option value="quickest">{d.t.sortQuickest}</option>
                  <option value="easiest">{d.t.sortEasiest}</option>
                </select>
              </label>
            </div>

            {filtered.length > 0 ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((r) => (
                  <RecipeCard
                    key={r.id}
                    recipe={r}
                    highlight={f.ingredients}
                    onOpen={() => (savedScroll = window.scrollY)}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-stone-300 bg-surface/60 px-6 py-16 text-center">
                <p className="text-5xl" aria-hidden>
                  🥄
                </p>
                <p className="font-display mt-3 text-xl font-semibold text-stone-900">{d.t.noMatchTitle}</p>
                <p className="mt-1 text-stone-600">{d.t.noMatchText}</p>
                <button
                  type="button"
                  onClick={f.clearAll}
                  className="mt-5 rounded-xl bg-terracotta px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                >
                  {d.t.clearFilters}
                </button>
              </div>
            )}
          </section>
        </div>
      </main>

      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label={d.t.filters}>
          <div className="absolute inset-0 bg-black/45" onClick={() => setDrawerOpen(false)} />
          <div className="animate-slide-up absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col rounded-t-3xl bg-cream shadow-2xl sm:inset-x-auto sm:top-0 sm:right-0 sm:bottom-0 sm:max-h-none sm:w-96 sm:rounded-none sm:rounded-l-3xl">
            <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
              <h2 className="font-display text-xl font-semibold text-stone-900">{d.t.filters}</h2>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label={d.t.closeFilters}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-stone-700 shadow-sm"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-5">{filters}</div>
            <div className="border-t border-stone-200 p-4">
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="w-full rounded-xl bg-stone-900 py-3 font-medium text-cream"
              >
                {d.t.showRecipes(filtered.length)}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

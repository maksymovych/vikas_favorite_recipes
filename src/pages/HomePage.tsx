import { ChevronDown, Search, SlidersHorizontal, Sparkles, X } from 'lucide-react'
import { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { useNavigate, useNavigationType } from 'react-router'
import CategoryTiles from '../components/CategoryTiles'
import Filters from '../components/Filters'
import Hero from '../components/Hero'
import RecipeCard from '../components/RecipeCard'
import { recipes } from '../data/recipes'
import { useFavorites } from '../favorites'
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
const usedCuisines = CUISINES.filter((c) => cuisineCounts[c] > 0).length

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

export function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

interface Props {
  f: FilterState
}

export default function HomePage({ f }: Props) {
  const { d } = useLang()
  const fav = useFavorites()
  const navigationType = useNavigationType()
  const navigate = useNavigate()
  const [sort, setSort] = useState<'az' | 'quickest' | 'easiest'>('az')
  const [drawerOpen, setDrawerOpen] = useState(false)

  useLayoutEffect(() => {
    window.scrollTo(0, navigationType === 'POP' ? savedScroll : 0)
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
  }, [])

  const localized = useMemo(() => recipes.map((r) => localizeRecipe(r, d)), [d])

  const filtered = useMemo(() => {
    const q = f.query.trim().toLowerCase()
    const result = localized.filter((r, idx) => {
      if (f.favoritesOnly && !fav.ids.includes(r.id)) return false
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
  }, [localized, f, fav.ids, sort, d])

  // Random recipe from what is currently shown (or from everything if nothing matches)
  const surprise = () => {
    const pool = filtered.length ? filtered : localized
    const r = pool[Math.floor(Math.random() * pool.length)]
    savedScroll = window.scrollY
    navigate(`/recipe/${r.id}`)
  }

  const title = f.favoritesOnly
    ? d.t.favoritesTitle
    : f.query.trim()
      ? d.t.resultsFor(f.query.trim())
      : f.category
        ? d.category(f.category)
        : d.t.featured
  const subtitle = f.hasActiveFilters ? d.t.recipesCount(filtered.length) : d.t.featuredSub

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
      <main className="relative mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <Hero
          recipes={localized}
          cuisineCount={usedCuisines}
          onBrowse={() => scrollToSection('recipes')}
        />

        <CategoryTiles
          value={f.category}
          onChange={(c) => {
            f.setCategory(c)
            f.setFavoritesOnly(false)
          }}
          counts={categoryCounts}
          total={recipes.length}
        />

        <div className="mt-8 lg:grid lg:grid-cols-[250px_1fr] lg:gap-10">
          <aside className="hidden lg:block">
            <div className="no-scrollbar sticky top-24 -ml-3 max-h-[calc(100dvh-7rem)] overflow-y-auto border-r border-stone-200/70 pt-1 pr-6 pb-6 pl-3">
              {filters}
            </div>
          </aside>

          <section id="recipes" className="scroll-mt-24">
            {/* Search sits right above the results, so you see them change as you type */}
            <div className="mb-8 flex flex-col gap-3 sm:flex-row">
              <label className="relative flex-1">
                <span className="sr-only">{d.t.searchLabel}</span>
                <Search
                  size={20}
                  className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-stone-400"
                />
                <input
                  id="recipe-search"
                  type="text"
                  inputMode="search"
                  autoComplete="off"
                  value={f.query}
                  onChange={(e) => f.setQuery(e.target.value)}
                  placeholder={d.t.heroSearch}
                  className="w-full rounded-2xl border border-stone-200 bg-surface py-3.5 pr-12 pl-12 text-base text-stone-800 shadow-sm outline-none placeholder:text-stone-400 focus:border-accent focus:ring-4 focus:ring-accent/15"
                />
                {f.query && (
                  <button
                    type="button"
                    onClick={() => f.setQuery('')}
                    aria-label={d.t.clearSearch}
                    title={d.t.clearSearch}
                    className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-800"
                  >
                    <X size={18} />
                  </button>
                )}
              </label>
              <button
                type="button"
                onClick={surprise}
                title={d.t.surpriseHint}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-accent px-6 py-3.5 font-semibold text-white shadow-md shadow-teal-700/20 transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <Sparkles size={18} /> {d.t.surprise}
              </button>
            </div>

            <div aria-live="polite" className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-3xl font-bold text-stone-900">{title}</h2>
                <p className="mt-1 text-stone-500">{subtitle}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                  className="relative inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-surface px-3.5 py-2 text-sm font-medium text-stone-800 shadow-sm lg:hidden"
                >
                  <SlidersHorizontal size={16} /> {d.t.filters}
                  {f.activeCount > 0 && (
                    <span className="absolute -top-2 -right-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-xs text-white">
                      {f.activeCount}
                    </span>
                  )}
                </button>
                <label className="relative">
                  <span className="sr-only">{d.t.sort}</span>
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as typeof sort)}
                    className="appearance-none rounded-xl border border-stone-200 bg-surface py-2 pr-9 pl-3.5 text-sm text-stone-800 shadow-sm outline-none focus:border-accent"
                  >
                    <option value="az">
                      {d.t.sort}: {d.t.sortAz}
                    </option>
                    <option value="quickest">
                      {d.t.sort}: {d.t.sortQuickest}
                    </option>
                    <option value="easiest">
                      {d.t.sort}: {d.t.sortEasiest}
                    </option>
                  </select>
                  <ChevronDown
                    size={16}
                    className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-stone-500"
                  />
                </label>
                {f.hasActiveFilters && (
                  <button
                    type="button"
                    onClick={f.clearAll}
                    className="hidden items-center gap-1.5 rounded-xl border border-stone-200 bg-surface px-3.5 py-2 text-sm font-medium text-stone-800 shadow-sm hover:bg-stone-100 sm:inline-flex"
                  >
                    <X size={15} /> {d.t.viewAll}
                  </button>
                )}
              </div>
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
                  {f.favoritesOnly ? '♡' : '🥄'}
                </p>
                <p className="font-display mt-3 text-xl font-semibold text-stone-900">
                  {f.favoritesOnly ? d.t.favoritesTitle : d.t.noMatchTitle}
                </p>
                <p className="mt-1 text-stone-600">{f.favoritesOnly ? d.t.favoritesEmpty : d.t.noMatchText}</p>
                <button
                  type="button"
                  onClick={f.clearAll}
                  className="mt-5 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
                >
                  {d.t.viewAll}
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
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-5">{filters}</div>
            <div className="border-t border-stone-200 p-4">
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="w-full rounded-xl bg-accent py-3 font-semibold text-white"
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

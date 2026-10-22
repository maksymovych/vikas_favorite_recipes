import { useCallback, useEffect, useMemo, useState } from 'react'
import Filters from './components/Filters'
import RecipeCard from './components/RecipeCard'
import RecipeModal from './components/RecipeModal'
import { recipes } from './data/recipes'
import { CATEGORIES, CUISINES, SEASONS, type Category, type Cuisine, type Season } from './types'

type Sort = 'az' | 'quickest' | 'easiest'

const DIFFICULTY_RANK = { Easy: 0, Medium: 1, Hard: 2 }

function toggle<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item]
}

export default function App() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<Category | null>(null)
  const [seasons, setSeasons] = useState<Season[]>([])
  const [cuisines, setCuisines] = useState<Cuisine[]>([])
  const [ingredients, setIngredients] = useState<string[]>([])
  const [sort, setSort] = useState<Sort>('az')
  const [openId, setOpenId] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const allIngredients = useMemo(() => {
    const counts = new Map<string, number>()
    for (const r of recipes) {
      for (const name of new Set(r.ingredients.map((i) => i.name))) {
        counts.set(name, (counts.get(name) ?? 0) + 1)
      }
    }
    return [...counts]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
  }, [])

  const seasonCounts = useMemo(() => {
    const counts = Object.fromEntries(SEASONS.map((s) => [s, 0])) as Record<Season, number>
    for (const r of recipes) for (const s of r.seasons) counts[s]++
    return counts
  }, [])

  const cuisineCounts = useMemo(() => {
    const counts = Object.fromEntries(CUISINES.map((c) => [c, 0])) as Record<Cuisine, number>
    for (const r of recipes) counts[r.cuisine]++
    return counts
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const result = recipes.filter((r) => {
      if (category && r.category !== category) return false
      if (seasons.length && !seasons.some((s) => r.seasons.includes(s))) return false
      if (cuisines.length && !cuisines.includes(r.cuisine)) return false
      if (ingredients.length && !ingredients.every((name) => r.ingredients.some((i) => i.name === name)))
        return false
      if (q) {
        const haystack = [r.title, r.description, r.category, r.cuisine, ...r.seasons, ...r.ingredients.map((i) => i.name)]
          .join(' ')
          .toLowerCase()
        if (!q.split(/\s+/).every((word) => haystack.includes(word))) return false
      }
      return true
    })
    return result.sort((a, b) => {
      if (sort === 'quickest')
        return a.prepMinutes + a.cookMinutes - (b.prepMinutes + b.cookMinutes)
      if (sort === 'easiest') return DIFFICULTY_RANK[a.difficulty] - DIFFICULTY_RANK[b.difficulty]
      return a.title.localeCompare(b.title)
    })
  }, [query, category, seasons, cuisines, ingredients, sort])

  const activeFilterCount = seasons.length + cuisines.length + ingredients.length
  const hasActiveFilters = activeFilterCount > 0 || !!category || !!query

  const clearAll = () => {
    setQuery('')
    setCategory(null)
    setSeasons([])
    setCuisines([])
    setIngredients([])
  }

  const openRecipe = recipes.find((r) => r.id === openId) ?? null
  const closeRecipe = useCallback(() => setOpenId(null), [])

  // Close the mobile drawer automatically when the screen grows to desktop size
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const onChange = () => mq.matches && setDrawerOpen(false)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const filters = (
    <Filters
      seasons={seasons}
      onToggleSeason={(s) => setSeasons((prev) => toggle(prev, s))}
      cuisines={cuisines}
      onToggleCuisine={(c) => setCuisines((prev) => toggle(prev, c))}
      cuisineCounts={cuisineCounts}
      ingredients={ingredients}
      onToggleIngredient={(n) => setIngredients((prev) => toggle(prev, n))}
      allIngredients={allIngredients}
      seasonCounts={seasonCounts}
      onClear={clearAll}
      hasActiveFilters={hasActiveFilters}
    />
  )

  return (
    <div className="min-h-dvh bg-cream text-stone-800">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-stone-200/70 bg-cream/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:gap-6 sm:px-6 lg:px-8">
          <a href="/" className="flex shrink-0 items-center gap-2" onClick={(e) => (e.preventDefault(), clearAll())}>
            <span className="text-3xl" aria-hidden>
              🍲
            </span>
            <span className="font-display text-xl leading-none font-bold text-stone-900 sm:text-2xl">
              Vika’s <span className="text-terracotta">Recipes</span>
            </span>
          </a>
          <div className="flex flex-1 gap-2">
            <label className="relative flex-1">
              <span className="sr-only">Search recipes</span>
              <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-stone-400" aria-hidden>
                🔍
              </span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by recipe name or ingredient…"
                className="w-full rounded-2xl border border-stone-200 bg-white py-2.5 pr-3 pl-10 text-sm shadow-sm outline-none placeholder:text-stone-400 focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 sm:text-base"
              />
            </label>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="relative flex items-center gap-1.5 rounded-2xl border border-stone-200 bg-white px-3.5 text-sm font-medium shadow-sm lg:hidden"
            >
              <span aria-hidden>⚙️</span> Filters
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-terracotta px-1 text-xs text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        {/* Hero */}
        <section className="py-6 sm:py-10">
          <h1 className="font-display max-w-2xl text-3xl leading-tight font-bold text-stone-900 sm:text-4xl lg:text-5xl">
            Favourite recipes for every season and celebration
          </h1>
          <p className="mt-3 max-w-xl text-stone-600 sm:text-lg">
            From Christmas cookies to Easter paska and summer salads — find something to cook by category, season or
            what’s in your fridge.
          </p>
        </section>

        {/* Category chips */}
        <nav aria-label="Categories" className="-mx-4 mb-6 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
            {[null, ...CATEGORIES].map((c) => {
              const active = category === c
              return (
                <button
                  key={c ?? 'all'}
                  type="button"
                  onClick={() => setCategory(c)}
                  aria-pressed={active}
                  className={`rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition ${
                    active
                      ? 'bg-stone-900 text-white shadow'
                      : 'bg-white text-stone-700 shadow-sm ring-1 ring-stone-200 hover:ring-stone-400'
                  }`}
                >
                  {c ?? 'All recipes'}
                </button>
              )
            })}
          </div>
        </nav>

        <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-10">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto pr-2 pb-4">{filters}</div>
          </aside>

          <section aria-live="polite">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-stone-600">
                <span className="font-semibold text-stone-900">{filtered.length}</span>{' '}
                {filtered.length === 1 ? 'recipe' : 'recipes'}
              </p>
              <label className="flex items-center gap-2 text-sm text-stone-600">
                Sort
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as Sort)}
                  className="rounded-xl border border-stone-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-terracotta"
                >
                  <option value="az">A–Z</option>
                  <option value="quickest">Quickest</option>
                  <option value="easiest">Easiest</option>
                </select>
              </label>
            </div>

            {filtered.length > 0 ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((r) => (
                  <RecipeCard key={r.id} recipe={r} highlight={ingredients} onOpen={() => setOpenId(r.id)} />
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-stone-300 bg-white/60 px-6 py-16 text-center">
                <p className="text-5xl" aria-hidden>
                  🥄
                </p>
                <p className="font-display mt-3 text-xl font-semibold">No recipes match</p>
                <p className="mt-1 text-stone-600">Try removing a filter or searching for something else.</p>
                <button
                  type="button"
                  onClick={clearAll}
                  className="mt-5 rounded-xl bg-terracotta px-4 py-2 text-sm font-medium text-white hover:bg-terracotta/90"
                >
                  Clear filters
                </button>
              </div>
            )}
          </section>
        </div>
      </main>

      <footer className="border-t border-stone-200 py-6 text-center text-sm text-stone-500">
        Made with ❤️ in Vika’s kitchen
      </footer>

      {/* Mobile / tablet filter drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <div className="absolute inset-0 bg-stone-900/40" onClick={() => setDrawerOpen(false)} />
          <div className="animate-slide-up absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col rounded-t-3xl bg-cream shadow-2xl sm:inset-x-auto sm:top-0 sm:right-0 sm:bottom-0 sm:max-h-none sm:w-96 sm:rounded-none sm:rounded-l-3xl">
            <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
              <h2 className="font-display text-xl font-semibold">Filters</h2>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close filters"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-stone-700 shadow-sm"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-5">{filters}</div>
            <div className="border-t border-stone-200 p-4">
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="w-full rounded-xl bg-stone-900 py-3 font-medium text-white"
              >
                Show {filtered.length} {filtered.length === 1 ? 'recipe' : 'recipes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {openRecipe && <RecipeModal recipe={openRecipe} onClose={closeRecipe} />}
    </div>
  )
}

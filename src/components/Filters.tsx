import { useMemo, useState } from 'react'
import { CUISINES, SEASONS, SEASON_ICONS, type Cuisine, type Season } from '../types'

interface Props {
  seasons: Season[]
  onToggleSeason: (s: Season) => void
  cuisines: Cuisine[]
  onToggleCuisine: (c: Cuisine) => void
  cuisineCounts: Record<Cuisine, number>
  ingredients: string[]
  onToggleIngredient: (name: string) => void
  allIngredients: { name: string; count: number }[]
  seasonCounts: Record<Season, number>
  onClear: () => void
  hasActiveFilters: boolean
}

const VISIBLE_INGREDIENTS = 18

export default function Filters({
  seasons,
  onToggleSeason,
  cuisines,
  onToggleCuisine,
  cuisineCounts,
  ingredients,
  onToggleIngredient,
  allIngredients,
  seasonCounts,
  onClear,
  hasActiveFilters,
}: Props) {
  const [ingredientQuery, setIngredientQuery] = useState('')
  const [showAll, setShowAll] = useState(false)

  const matchingIngredients = useMemo(() => {
    const q = ingredientQuery.trim().toLowerCase()
    const list = q ? allIngredients.filter((i) => i.name.includes(q)) : allIngredients
    // Selected ones always stay visible at the top
    const selected = list.filter((i) => ingredients.includes(i.name))
    const rest = list.filter((i) => !ingredients.includes(i.name))
    return [...selected, ...rest]
  }, [allIngredients, ingredientQuery, ingredients])

  const visible =
    showAll || ingredientQuery ? matchingIngredients : matchingIngredients.slice(0, VISIBLE_INGREDIENTS)

  return (
    <div className="space-y-7">
      <section>
        <h3 className="mb-3 text-xs font-semibold tracking-wider text-stone-500 uppercase">
          Season & occasion
        </h3>
        <div className="flex flex-wrap gap-2">
          {SEASONS.map((s) => {
            const active = seasons.includes(s)
            return (
              <button
                key={s}
                type="button"
                onClick={() => onToggleSeason(s)}
                aria-pressed={active}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition ${
                  active
                    ? 'border-terracotta bg-terracotta text-white shadow-sm'
                    : 'border-stone-200 bg-white text-stone-700 hover:border-terracotta/50'
                }`}
              >
                <span aria-hidden>{SEASON_ICONS[s]}</span>
                {s}
                <span className={`text-xs ${active ? 'text-white/80' : 'text-stone-400'}`}>
                  {seasonCounts[s]}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-xs font-semibold tracking-wider text-stone-500 uppercase">Cuisine</h3>
        <div className="flex flex-wrap gap-2">
          {CUISINES.map((c) => {
            const active = cuisines.includes(c)
            return (
              <button
                key={c}
                type="button"
                onClick={() => onToggleCuisine(c)}
                aria-pressed={active}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition ${
                  active
                    ? 'border-stone-900 bg-stone-900 text-white shadow-sm'
                    : 'border-stone-200 bg-white text-stone-700 hover:border-stone-400'
                }`}
              >
                {c}
                <span className={`text-xs ${active ? 'text-white/80' : 'text-stone-400'}`}>{cuisineCounts[c]}</span>
              </button>
            )
          })}
        </div>
      </section>

      <section>
        <h3 className="mb-1 text-xs font-semibold tracking-wider text-stone-500 uppercase">
          Ingredients
        </h3>
        <p className="mb-3 text-xs text-stone-500">Show recipes that use all selected ingredients.</p>
        <input
          type="search"
          value={ingredientQuery}
          onChange={(e) => setIngredientQuery(e.target.value)}
          placeholder="Find an ingredient…"
          className="mb-3 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-stone-400 focus:border-terracotta focus:ring-2 focus:ring-terracotta/20"
        />
        <div className="flex flex-wrap gap-1.5">
          {visible.map(({ name, count }) => {
            const active = ingredients.includes(name)
            return (
              <button
                key={name}
                type="button"
                onClick={() => onToggleIngredient(name)}
                aria-pressed={active}
                className={`rounded-lg border px-2.5 py-1 text-sm capitalize transition ${
                  active
                    ? 'border-olive bg-olive text-white'
                    : 'border-stone-200 bg-white text-stone-700 hover:border-olive/60'
                }`}
              >
                {active && <span aria-hidden>✓ </span>}
                {name}
                <span className={`ml-1 text-xs ${active ? 'text-white/80' : 'text-stone-400'}`}>
                  {count}
                </span>
              </button>
            )
          })}
          {visible.length === 0 && <p className="text-sm text-stone-500">No ingredient matches.</p>}
        </div>
        {!ingredientQuery && matchingIngredients.length > VISIBLE_INGREDIENTS && (
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="mt-3 text-sm font-medium text-terracotta hover:underline"
          >
            {showAll ? 'Show fewer' : `Show all ${matchingIngredients.length} ingredients`}
          </button>
        )}
      </section>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={onClear}
          className="w-full rounded-xl border border-stone-300 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
        >
          Clear all filters
        </button>
      )}
    </div>
  )
}

import { useMemo, useState } from 'react'
import { useLang } from '../i18n'
import { CUISINES, SEASONS, SEASON_ICONS, type Cuisine, type Season } from '../types'

interface Props {
  seasons: Season[]
  onToggleSeason: (s: Season) => void
  seasonCounts: Record<Season, number>
  cuisines: Cuisine[]
  onToggleCuisine: (c: Cuisine) => void
  cuisineCounts: Record<Cuisine, number>
  ingredients: string[]
  onToggleIngredient: (name: string) => void
  allIngredients: { name: string; count: number }[]
  onClear: () => void
  hasActiveFilters: boolean
}

const VISIBLE_INGREDIENTS = 18

const heading = 'mb-3 text-xs font-semibold tracking-wider text-stone-500 uppercase'
const pill = (active: boolean, activeCls: string) =>
  `inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition ${
    active ? activeCls : 'border-stone-200 bg-surface text-stone-700 hover:border-stone-300 hover:bg-stone-100'
  }`

export default function Filters(props: Props) {
  const { d } = useLang()
  const { seasons, cuisines, ingredients } = props
  const [ingredientQuery, setIngredientQuery] = useState('')
  const [showAll, setShowAll] = useState(false)

  const matchingIngredients = useMemo(() => {
    const q = ingredientQuery.trim().toLowerCase()
    const list = props.allIngredients
      .map((i) => ({ ...i, label: d.ingredient(i.name) }))
      .filter((i) => !q || i.label.toLowerCase().includes(q) || i.name.includes(q))
    // Selected ingredients always stay at the top
    return [...list.filter((i) => ingredients.includes(i.name)), ...list.filter((i) => !ingredients.includes(i.name))]
  }, [props.allIngredients, ingredientQuery, ingredients, d])

  const visible =
    showAll || ingredientQuery ? matchingIngredients : matchingIngredients.slice(0, VISIBLE_INGREDIENTS)

  return (
    <div className="space-y-7">
      <section>
        <h3 className={heading}>{d.t.season}</h3>
        <div className="flex flex-wrap gap-2">
          {SEASONS.map((s) => {
            const active = seasons.includes(s)
            return (
              <button
                key={s}
                type="button"
                onClick={() => props.onToggleSeason(s)}
                aria-pressed={active}
                className={pill(active, 'border-terracotta bg-terracotta text-white shadow-sm')}
              >
                <span aria-hidden>{SEASON_ICONS[s]}</span>
                {d.season(s)}
                <span className={`text-xs ${active ? 'text-white/80' : 'text-stone-400'}`}>
                  {props.seasonCounts[s]}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <section>
        <h3 className={heading}>{d.t.cuisine}</h3>
        <div className="flex flex-wrap gap-2">
          {CUISINES.map((c) => {
            const active = cuisines.includes(c)
            return (
              <button
                key={c}
                type="button"
                onClick={() => props.onToggleCuisine(c)}
                aria-pressed={active}
                className={pill(active, 'border-stone-900 bg-stone-900 text-cream shadow-sm')}
              >
                {d.cuisine(c)}
                <span className={`text-xs ${active ? 'opacity-75' : 'text-stone-400'}`}>{props.cuisineCounts[c]}</span>
              </button>
            )
          })}
        </div>
      </section>

      <section>
        <h3 className="mb-1 text-xs font-semibold tracking-wider text-stone-500 uppercase">{d.t.ingredients}</h3>
        <p className="mb-3 text-xs text-stone-500">{d.t.ingredientsHint}</p>
        <input
          type="search"
          value={ingredientQuery}
          onChange={(e) => setIngredientQuery(e.target.value)}
          placeholder={d.t.findIngredient}
          className="mb-3 w-full rounded-xl border border-stone-200 bg-surface px-3 py-2 text-sm text-stone-800 outline-none placeholder:text-stone-400 focus:border-terracotta focus:ring-2 focus:ring-terracotta/20"
        />
        <div className="flex flex-wrap gap-1.5">
          {visible.map(({ name, label, count }) => {
            const active = ingredients.includes(name)
            return (
              <button
                key={name}
                type="button"
                onClick={() => props.onToggleIngredient(name)}
                aria-pressed={active}
                className={`rounded-lg border px-2.5 py-1 text-sm transition first-letter:uppercase ${
                  active
                    ? 'border-olive bg-olive text-white'
                    : 'border-stone-200 bg-surface text-stone-700 hover:border-olive/60'
                }`}
              >
                {active && <span aria-hidden>✓ </span>}
                {label}
                <span className={`ml-1 text-xs ${active ? 'text-white/80' : 'text-stone-400'}`}>{count}</span>
              </button>
            )
          })}
          {visible.length === 0 && <p className="text-sm text-stone-500">{d.t.noIngredient}</p>}
        </div>
        {!ingredientQuery && matchingIngredients.length > VISIBLE_INGREDIENTS && (
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="mt-3 text-sm font-medium text-terracotta hover:underline"
          >
            {showAll ? d.t.showFewer : d.t.showAllIngredients(matchingIngredients.length)}
          </button>
        )}
      </section>

      {props.hasActiveFilters && (
        <button
          type="button"
          onClick={props.onClear}
          className="w-full rounded-xl border border-stone-300 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
        >
          {d.t.clearAll}
        </button>
      )}
    </div>
  )
}

import { Check, Search } from 'lucide-react'
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

const VISIBLE_INGREDIENTS = 16
const heading = 'mb-3 text-xs font-semibold tracking-[0.12em] text-accent uppercase'

function Row({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean
  onClick: () => void
  icon?: string
  label: string
  count: number
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-[15px] transition outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset ${
          active ? 'bg-accent-soft font-semibold text-accent' : 'text-stone-700 hover:bg-stone-100'
        }`}
      >
        {icon && (
          <span className="w-6 text-center text-lg" aria-hidden>
            {icon}
          </span>
        )}
        <span className="flex-1">{label}</span>
        {active ? (
          <Check size={16} className="text-accent" />
        ) : (
          <span className="text-sm text-stone-400">{count}</span>
        )}
      </button>
    </li>
  )
}

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
    <div className="space-y-8">
      <section id="seasons" className="scroll-mt-28">
        <h3 className={heading}>{d.t.season}</h3>
        <ul className="-mx-3 space-y-0.5">
          {SEASONS.map((s) => (
            <Row
              key={s}
              active={seasons.includes(s)}
              onClick={() => props.onToggleSeason(s)}
              icon={SEASON_ICONS[s]}
              label={d.season(s)}
              count={props.seasonCounts[s]}
            />
          ))}
        </ul>
      </section>

      <section>
        <h3 className={heading}>{d.t.cuisine}</h3>
        <ul className="-mx-3 space-y-0.5">
          {CUISINES.map((c) => (
            <Row
              key={c}
              active={cuisines.includes(c)}
              onClick={() => props.onToggleCuisine(c)}
              label={d.cuisine(c)}
              count={props.cuisineCounts[c]}
            />
          ))}
        </ul>
      </section>

      <section>
        <h3 className="mb-1 text-xs font-semibold tracking-[0.12em] text-accent uppercase">{d.t.ingredients}</h3>
        <p className="mb-3 text-xs text-stone-500">{d.t.ingredientsHint}</p>
        <label className="relative mb-3 block">
          <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-stone-400" />
          <input
            type="search"
            value={ingredientQuery}
            onChange={(e) => setIngredientQuery(e.target.value)}
            placeholder={d.t.findIngredient}
            className="w-full rounded-xl border border-stone-200 bg-surface py-2 pr-3 pl-9 text-sm text-stone-800 outline-none placeholder:text-stone-400 focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </label>
        <div className="flex flex-wrap gap-1.5">
          {visible.map(({ name, label, count }) => {
            const active = ingredients.includes(name)
            return (
              <button
                key={name}
                type="button"
                onClick={() => props.onToggleIngredient(name)}
                aria-pressed={active}
                className={`rounded-full border px-3 py-1 text-sm transition first-letter:uppercase ${
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
            className="mt-3 text-sm font-medium text-accent hover:underline"
          >
            {showAll ? d.t.showFewer : d.t.showAllIngredients(matchingIngredients.length)} →
          </button>
        )}
      </section>

      {props.hasActiveFilters && (
        <button
          type="button"
          onClick={props.onClear}
          className="w-full rounded-xl border border-stone-300 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
        >
          {d.t.clearAll}
        </button>
      )}
    </div>
  )
}

import { CATEGORY_STYLES, SEASON_ICONS, type Recipe } from '../types'
import { formatTime } from '../utils'

interface Props {
  recipe: Recipe
  onOpen: () => void
  highlight: string[]
}

export default function RecipeCard({ recipe, onOpen, highlight }: Props) {
  const total = recipe.prepMinutes + recipe.cookMinutes
  const matched = recipe.ingredients.filter((i) => highlight.includes(i.name)).map((i) => i.name)

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-stone-200/80 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:outline-none"
    >
      <div
        className={`relative flex aspect-[16/10] items-center justify-center bg-gradient-to-br ${CATEGORY_STYLES[recipe.category]}`}
      >
        <span className="text-6xl drop-shadow-sm transition group-hover:scale-110 sm:text-7xl" aria-hidden>
          {recipe.emoji}
        </span>
        <span className="absolute top-3 left-3 rounded-full bg-white/85 px-2.5 py-0.5 text-xs font-semibold text-stone-700 backdrop-blur">
          {recipe.category}
        </span>
        <span className="absolute top-3 right-3 flex gap-0.5 rounded-full bg-white/85 px-2 py-0.5 text-sm backdrop-blur">
          {recipe.seasons
            .filter((s) => s !== 'Everyday')
            .slice(0, 3)
            .map((s) => (
              <span key={s} title={s}>
                {SEASON_ICONS[s]}
              </span>
            ))}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-display text-lg leading-snug font-semibold text-stone-900">{recipe.title}</h3>
        <p className="line-clamp-2 text-sm text-stone-600">{recipe.description}</p>
        {matched.length > 0 && (
          <p className="text-xs text-olive">
            Uses: <span className="capitalize">{matched.join(', ')}</span>
          </p>
        )}
        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 text-xs text-stone-500">
          <span>🌍 {recipe.cuisine}</span>
          <span>⏱ {formatTime(total)}</span>
          <span>👥 {recipe.servings}</span>
          <span>📊 {recipe.difficulty}</span>
        </div>
      </div>
    </button>
  )
}

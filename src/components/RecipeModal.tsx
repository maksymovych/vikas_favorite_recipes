import { useEffect, useState } from 'react'
import { CATEGORY_STYLES, SEASON_ICONS, type Recipe } from '../types'
import { formatTime } from '../utils'

interface Props {
  recipe: Recipe
  onClose: () => void
}

export default function RecipeModal({ recipe, onClose }: Props) {
  const [checked, setChecked] = useState<Set<number>>(new Set())

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  const toggle = (i: number) =>
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-stone-900/50 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="recipe-title"
    >
      <div
        className="animate-slide-up flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-cream shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`relative flex shrink-0 items-center gap-4 bg-gradient-to-br px-5 py-5 sm:px-8 sm:py-7 ${CATEGORY_STYLES[recipe.category]}`}
        >
          <span className="text-5xl sm:text-6xl" aria-hidden>
            {recipe.emoji}
          </span>
          <div className="min-w-0 pr-8">
            <p className="text-xs font-semibold tracking-wider text-stone-700/80 uppercase">{recipe.category}</p>
            <h2 id="recipe-title" className="font-display text-2xl leading-tight font-bold text-stone-900 sm:text-3xl">
              {recipe.title}
            </h2>
            {recipe.credit && <p className="mt-1 text-sm text-stone-700 italic">{recipe.credit}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close recipe"
            className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-lg text-stone-700 transition hover:bg-white"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-6 sm:px-8">
          <p className="text-stone-700">{recipe.description}</p>

          <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ['Prep', formatTime(recipe.prepMinutes)],
              ['Cook', recipe.cookMinutes ? formatTime(recipe.cookMinutes) : 'No cooking'],
              ['Serves', recipe.servings],
              ['Difficulty', recipe.difficulty],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-white px-3 py-2.5 shadow-sm">
                <dt className="text-xs text-stone-500">{label}</dt>
                <dd className="font-semibold text-stone-800">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-4 flex flex-wrap gap-2">
            {recipe.seasons.map((s) => (
              <span key={s} className="rounded-full bg-white px-3 py-1 text-sm text-stone-700 shadow-sm">
                {SEASON_ICONS[s]} {s}
              </span>
            ))}
          </div>

          <div className="mt-8 grid gap-8 md:grid-cols-[2fr_3fr]">
            <section>
              <h3 className="font-display mb-3 text-xl font-semibold text-stone-900">Ingredients</h3>
              <ul className="space-y-1">
                {recipe.ingredients.map((ing, i) => (
                  <li key={i}>
                    <label className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-1.5 hover:bg-white">
                      <input
                        type="checkbox"
                        checked={checked.has(i)}
                        onChange={() => toggle(i)}
                        className="mt-1 h-4 w-4 shrink-0 accent-olive"
                      />
                      <span className={checked.has(i) ? 'text-stone-400 line-through' : 'text-stone-800'}>
                        <span className="font-semibold">{ing.amount}</span> {ing.name}
                        {ing.note && <span className="text-stone-500"> — {ing.note}</span>}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h3 className="font-display mb-3 text-xl font-semibold text-stone-900">Method</h3>
              <ol className="space-y-4">
                {recipe.steps.map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-terracotta text-sm font-semibold text-white">
                      {i + 1}
                    </span>
                    <p className="pt-0.5 leading-relaxed text-stone-800">{step}</p>
                  </li>
                ))}
              </ol>

              {recipe.tips && recipe.tips.length > 0 && (
                <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <h4 className="mb-1 font-semibold text-amber-900">💡 Tips</h4>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-amber-900">
                    {recipe.tips.map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

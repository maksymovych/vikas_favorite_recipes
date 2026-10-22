import { useState } from 'react'
import { Link } from 'react-router'
import { photos } from '../data/photos'
import { useLang } from '../i18n'
import type { LocalRecipe } from '../localize'
import { CATEGORY_ICONS, SEASON_ICONS } from '../types'

interface Props {
  recipe: LocalRecipe
  onOpen: () => void
  highlight: string[]
}

export default function RecipeCard({ recipe, onOpen, highlight }: Props) {
  const { d } = useLang()
  const photo = photos[recipe.id]
  const [loaded, setLoaded] = useState(false)
  const total = recipe.prepMinutes + recipe.cookMinutes
  const matched = recipe.ingredients.filter((i) => highlight.includes(i.name)).map((i) => i.label)
  const main = recipe.categories[0]

  return (
    <Link
      to={`/recipe/${recipe.id}`}
      onClick={onOpen}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-stone-200/80 bg-surface text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:outline-none"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-amber-100 to-orange-200 dark:from-stone-200 dark:to-stone-300">
        <span className="absolute inset-0 flex items-center justify-center text-6xl" aria-hidden>
          {recipe.emoji}
        </span>
        {photo && (
          <img
            src={photo.src}
            alt={recipe.title}
            loading="lazy"
            decoding="async"
            onLoad={() => setLoaded(true)}
            className={`absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105 ${
              loaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}
        <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-stone-800 shadow-sm backdrop-blur dark:bg-black/60 dark:text-stone-900">
          <span aria-hidden>{CATEGORY_ICONS[main]}</span>
          {d.category(main)}
        </span>
        {recipe.seasons.some((s) => s !== 'Everyday') && (
          <span className="absolute top-3 right-3 flex gap-0.5 rounded-full bg-white/90 px-2 py-0.5 text-sm shadow-sm backdrop-blur dark:bg-black/60">
            {recipe.seasons
              .filter((s) => s !== 'Everyday')
              .slice(0, 3)
              .map((s) => (
                <span key={s} title={d.season(s)}>
                  {SEASON_ICONS[s]}
                </span>
              ))}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-display text-lg leading-snug font-semibold text-stone-900">{recipe.title}</h3>
        <p className="line-clamp-2 text-sm text-stone-600">{recipe.description}</p>
        {matched.length > 0 && (
          <p className="text-xs text-olive">
            {d.t.uses} {matched.join(', ')}
          </p>
        )}
        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-2 text-xs text-stone-500">
          <span>🌍 {d.cuisine(recipe.cuisine)}</span>
          <span>⏱ {d.time(total)}</span>
          <span>📊 {d.difficulty(recipe.difficulty)}</span>
        </div>
      </div>
    </Link>
  )
}

import { Clock, Heart, Signal } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { photos } from '../data/photos'
import { useFavorites } from '../favorites'
import { useLang } from '../i18n'
import type { LocalRecipe } from '../localize'
import { CATEGORY_GROUPS, SEASON_ICONS, type Category } from '../types'

const BADGE_COLORS = ['bg-terracotta', 'bg-rose-600', 'bg-amber-600', 'bg-emerald-600']

function badgeColor(c: Category) {
  const group = CATEGORY_GROUPS.findIndex((g) => (g as readonly Category[]).includes(c))
  return BADGE_COLORS[group] ?? BADGE_COLORS[0]
}

interface Props {
  recipe: LocalRecipe
  onOpen: () => void
  highlight?: string[]
}

export function FavoriteButton({ id, className = '' }: { id: string; className?: string }) {
  const { d } = useLang()
  const fav = useFavorites()
  const on = fav.has(id)
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        fav.toggle(id)
      }}
      aria-pressed={on}
      aria-label={on ? d.t.removeFavorite : d.t.addFavorite}
      title={on ? d.t.removeFavorite : d.t.addFavorite}
      className={`flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-stone-800 shadow-md backdrop-blur transition hover:scale-110 dark:bg-black/55 dark:text-white ${className}`}
    >
      <Heart size={18} className={on ? 'fill-terracotta text-terracotta' : ''} strokeWidth={2.2} />
    </button>
  )
}

export default function RecipeCard({ recipe, onOpen, highlight = [] }: Props) {
  const { d } = useLang()
  const photo = photos[recipe.id]
  const [loaded, setLoaded] = useState(false)
  const total = recipe.prepMinutes + recipe.cookMinutes
  const matched = recipe.ingredients.filter((i) => highlight.includes(i.name)).map((i) => i.label)
  const main = recipe.categories[0]
  const festive = recipe.seasons.filter((s) => s !== 'Everyday').slice(0, 3)

  return (
    <article className="group relative aspect-[5/4] overflow-hidden rounded-3xl bg-gradient-to-br from-amber-100 to-orange-200 shadow-sm ring-1 ring-black/5 transition duration-300 hover:-translate-y-1 hover:shadow-xl dark:from-stone-200 dark:to-stone-300">
      <span className="absolute inset-0 flex items-center justify-center text-6xl" aria-hidden>
        {recipe.emoji}
      </span>
      {photo && (
        <img
          src={photo.src}
          alt=""
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          className={`absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/0" />

      {/* Whole card is the link */}
      <Link
        to={`/recipe/${recipe.id}`}
        onClick={onOpen}
        className="absolute inset-0 z-10 rounded-3xl focus-visible:ring-4 focus-visible:ring-terracotta focus-visible:outline-none"
      >
        <span className="sr-only">{recipe.title}</span>
      </Link>

      <span
        className={`absolute top-3 left-3 rounded-full px-3 py-1 text-xs font-semibold text-white shadow ${badgeColor(main)}`}
      >
        {d.category(main)}
      </span>
      <FavoriteButton id={recipe.id} className="absolute top-3 right-3 z-20" />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4 text-white">
        {festive.length > 0 && (
          <p className="mb-1 text-sm" aria-hidden>
            {festive.map((s) => SEASON_ICONS[s]).join(' ')}
          </p>
        )}
        <h3 className="font-display text-xl leading-tight font-bold drop-shadow-sm">{recipe.title}</h3>
        {matched.length > 0 && (
          <p className="mt-1 line-clamp-1 text-xs text-lime-200">
            {d.t.uses} {matched.join(', ')}
          </p>
        )}
        <div className="mt-2 flex items-center gap-4 text-sm text-white/90">
          <span className="inline-flex items-center gap-1.5">
            <Clock size={15} /> {d.time(total)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Signal size={15} /> {d.difficulty(recipe.difficulty)}
          </span>
          <span className="ml-auto truncate text-xs text-white/75">{d.cuisine(recipe.cuisine)}</span>
        </div>
      </div>
    </article>
  )
}

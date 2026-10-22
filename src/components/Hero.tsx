import { ArrowDown, Clock, Heart, Signal, Star } from 'lucide-react'
import { Link } from 'react-router'
import { photos } from '../data/recipePhotos'
import { useLang } from '../i18n'
import type { LocalRecipe } from '../localize'
import { FavoriteButton } from './RecipeCard'

interface Props {
  recipes: LocalRecipe[]
  cuisineCount: number
  onBrowse: () => void
}

/** The recipe shown in the big hero photo. Change the id to feature a different one. */
const FEATURED_ID = 'ukrainian-borscht'

function featuredRecipe(list: LocalRecipe[]) {
  return list.find((r) => r.id === FEATURED_ID) ?? list.find((r) => photos[r.id])
}

function Leaf({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden>
      <path d="M8 56C14 30 30 12 58 6c-4 26-20 44-50 50Z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
      <path d="M8 56C22 40 34 28 50 14" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export default function Hero({ recipes, cuisineCount, onBrowse }: Props) {
  const { d } = useLang()
  const today = featuredRecipe(recipes)
  const thumbs = recipes.filter((r) => photos[r.id]).slice(0, 5)

  return (
    <section className="relative grid items-center gap-10 py-8 sm:py-12 lg:grid-cols-[1.05fr_1fr] lg:gap-12 lg:py-16">
      <div className="relative">
        <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-accent uppercase sm:text-sm">
          {d.t.eyebrow} <Heart size={14} className="fill-accent" />
        </p>
        <Leaf className="absolute -top-6 right-4 hidden h-14 w-14 rotate-12 text-accent/45 sm:block lg:right-10" />

        <h1 className="font-display mt-4 text-[2.6rem] leading-[1.05] font-extrabold tracking-tight text-stone-900 sm:text-6xl lg:text-[4.2rem]">
          {d.t.heroBefore}{' '}
          <span className="font-script relative inline-block px-1 text-[0.92em] font-normal text-accent">
            {d.t.heroAccent}
            <svg
              viewBox="0 0 200 20"
              preserveAspectRatio="none"
              className="absolute -bottom-2 left-0 h-3 w-full text-accent"
              aria-hidden
            >
              <path d="M3 14C40 4 90 2 197 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
            </svg>
          </span>{' '}
          {d.t.heroAfter}
        </h1>

        <p className="mt-6 max-w-xl text-lg leading-relaxed text-stone-600">{d.t.heroSub}</p>

        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-5">
          <button
            type="button"
            onClick={onBrowse}
            className="inline-flex items-center gap-2 rounded-2xl bg-accent px-6 py-4 font-semibold text-white shadow-lg shadow-teal-700/25 transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            {d.t.browse} <ArrowDown size={18} />
          </button>

          <div className="flex items-center gap-4">
          <div className="flex -space-x-3">
            {thumbs.map((r) => (
              <img
                key={r.id}
                src={photos[r.id].src}
                alt=""
                className="h-9 w-9 rounded-full border-2 border-cream object-cover"
              />
            ))}
          </div>
            <p className="text-sm text-stone-600">{d.t.stats(recipes.length, cuisineCount)}</p>
          </div>
        </div>
      </div>

      {/* Recipe of the day */}
      {today && (
        <div className="relative">
          <div
            className="absolute -top-6 -right-4 hidden h-28 w-28 opacity-60 lg:block"
            style={{ backgroundImage: 'radial-gradient(var(--color-accent) 1.5px, transparent 1.5px)', backgroundSize: '14px 14px' }}
            aria-hidden
          />
          <Leaf className="absolute -bottom-6 -left-6 hidden h-16 w-16 -rotate-45 text-accent/40 lg:block" />
          <article className="group relative aspect-[4/3] overflow-hidden rounded-[2rem] shadow-2xl shadow-teal-900/15 sm:aspect-[16/11]">
            <img
              src={photos[today.id].src}
              alt={today.title}
              className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/10" />
            <Link to={`/recipe/${today.id}`} className="absolute inset-0 z-10">
              <span className="sr-only">{today.title}</span>
            </Link>
            <span className="absolute top-5 left-5 inline-flex items-center gap-2 rounded-full bg-stone-900/75 px-4 py-2 text-sm font-semibold text-white backdrop-blur dark:bg-black/70 dark:text-white">
              <Star size={16} className="fill-amber-400 text-amber-400" /> {d.t.recipeOfDay}
            </span>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 text-white sm:p-7">
              <div>
                <h2 className="font-display text-2xl leading-tight font-bold sm:text-3xl">{today.title}</h2>
                <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/90">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock size={15} /> {d.time(today.prepMinutes + today.cookMinutes)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Signal size={15} /> {d.difficulty(today.difficulty)}
                  </span>
                  <span>{d.category(today.categories[0])}</span>
                </p>
              </div>
            </div>
            <FavoriteButton id={today.id} className="absolute right-5 bottom-5 z-20 sm:right-7 sm:bottom-7" />
          </article>
        </div>
      )}
    </section>
  )
}

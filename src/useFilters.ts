import { useState } from 'react'
import type { Category, Cuisine, Season } from './types'

function toggle<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item]
}

/** Search & filter state. Lives in App so it survives opening a recipe and coming back. */
export function useFilters() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<Category | null>(null)
  const [seasons, setSeasons] = useState<Season[]>([])
  const [cuisines, setCuisines] = useState<Cuisine[]>([])
  const [ingredients, setIngredients] = useState<string[]>([])

  const activeCount = seasons.length + cuisines.length + ingredients.length

  return {
    query,
    setQuery,
    category,
    setCategory,
    seasons,
    toggleSeason: (s: Season) => setSeasons((prev) => toggle(prev, s)),
    cuisines,
    toggleCuisine: (c: Cuisine) => setCuisines((prev) => toggle(prev, c)),
    ingredients,
    toggleIngredient: (n: string) => setIngredients((prev) => toggle(prev, n)),
    activeCount,
    hasActiveFilters: activeCount > 0 || !!category || !!query,
    clearAll: () => {
      setQuery('')
      setCategory(null)
      setSeasons([])
      setCuisines([])
      setIngredients([])
    },
  }
}

export type FilterState = ReturnType<typeof useFilters>

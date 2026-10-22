import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

const KEY = 'recipes-favorites'

function load(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []
  } catch {
    return []
  }
}

const FavoritesContext = createContext<{ ids: string[]; has: (id: string) => boolean; toggle: (id: string) => void } | null>(
  null,
)

/** Favorite recipes, remembered in this browser. */
export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>(load)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(ids))
    } catch {
      /* storage unavailable */
    }
  }, [ids])

  const value = {
    ids,
    has: (id: string) => ids.includes(id),
    toggle: (id: string) => setIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])),
  }
  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext)
  if (!ctx) throw new Error('useFavorites must be used inside FavoritesProvider')
  return ctx
}

import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'
const KEY = 'recipes-theme'

export function useTheme() {
  // index.html already applied the right class before React started
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light',
  )

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  const toggle = () =>
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark'
      try {
        localStorage.setItem(KEY, next)
      } catch {
        /* storage unavailable */
      }
      return next
    })

  return { theme, toggle }
}

import { useState } from 'react'
import { Link, Route, Routes, useLocation, useNavigate } from 'react-router'
import { useLang, type Lang } from './i18n'
import HomePage from './pages/HomePage'
import RecipePage from './pages/RecipePage'
import { useTheme } from './theme'
import { useFilters } from './useFilters'

export default function App() {
  const { d, setLang } = useLang()
  const { theme, toggle: toggleTheme } = useTheme()
  const f = useFilters()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const onHome = location.pathname === '/'

  const onSearch = (value: string) => {
    f.setQuery(value)
    if (!onHome) navigate('/')
  }

  const headerControls = (
    <div className="flex shrink-0 items-center gap-2">
      <div
        role="group"
        aria-label={d.t.language}
        className="flex rounded-full border border-stone-200 bg-surface p-0.5 text-xs font-semibold shadow-sm"
      >
        {(['en', 'uk'] as Lang[]).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLang(l)}
            aria-pressed={d.lang === l}
            className={`rounded-full px-2.5 py-1.5 transition ${
              d.lang === l ? 'bg-stone-900 text-cream' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            {l === 'en' ? 'EN' : 'УК'}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={theme === 'dark' ? d.t.toLight : d.t.toDark}
        title={theme === 'dark' ? d.t.toLight : d.t.toDark}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 bg-surface text-base shadow-sm transition hover:bg-stone-100"
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
    </div>
  )

  return (
    <div className="flex min-h-dvh flex-col bg-cream text-stone-800 print:bg-white">
      <header className="sticky top-0 z-30 border-b border-stone-200/70 bg-cream/90 backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:gap-5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3">
            <Link to="/" onClick={f.clearAll} className="flex shrink-0 items-center gap-2">
              <span className="text-3xl" aria-hidden>
                🍲
              </span>
              <span className="font-display text-xl leading-none font-bold text-stone-900 sm:text-2xl">
                {d.t.siteName} <span className="text-terracotta">{d.t.siteNameAccent}</span>
              </span>
            </Link>
            <div className="sm:hidden">{headerControls}</div>
          </div>
          <div className="flex flex-1 gap-2">
            <label className="relative flex-1">
              <span className="sr-only">{d.t.searchLabel}</span>
              <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-stone-400" aria-hidden>
                🔍
              </span>
              <input
                type="search"
                value={f.query}
                onChange={(e) => onSearch(e.target.value)}
                placeholder={d.t.searchPlaceholder}
                className="w-full rounded-2xl border border-stone-200 bg-surface py-2.5 pr-3 pl-10 text-sm text-stone-800 shadow-sm outline-none placeholder:text-stone-400 focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 sm:text-base"
              />
            </label>
            {onHome && (
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="relative flex items-center gap-1.5 rounded-2xl border border-stone-200 bg-surface px-3.5 text-sm font-medium shadow-sm lg:hidden"
              >
                <span aria-hidden>⚙️</span>
                <span className="hidden min-[400px]:inline">{d.t.filters}</span>
                {f.activeCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-terracotta px-1 text-xs text-white">
                    {f.activeCount}
                  </span>
                )}
              </button>
            )}
          </div>
          <div className="hidden sm:block">{headerControls}</div>
        </div>
      </header>

      <div className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage f={f} drawerOpen={drawerOpen} setDrawerOpen={setDrawerOpen} />} />
          <Route path="/recipe/:id" element={<RecipePage />} />
          <Route path="*" element={<RecipePage />} />
        </Routes>
      </div>

      <footer className="border-t border-stone-200 py-6 text-center text-sm text-stone-500 print:hidden">
        <p>{d.t.footer}</p>
        <p className="mt-1 text-xs text-stone-400">{d.t.photosFrom}</p>
      </footer>
    </div>
  )
}

import { CookingPot, Heart, House, Mail, Moon, Search, Sun } from 'lucide-react'
import { lazy, Suspense, useEffect } from 'react'
import { Link, Route, Routes, useLocation, useNavigate } from 'react-router'
import { useFavorites } from './favorites'
import { useLang, type Lang } from './i18n'
import HomePage, { scrollToSection } from './pages/HomePage'
import RecipePage from './pages/RecipePage'
import { useTheme } from './theme'
import { useFilters } from './useFilters'

// Loaded only when someone opens the contact page (keeps the main page fast)
const ContactPage = lazy(() => import('./pages/ContactPage'))

export default function App() {
  const { d, setLang } = useLang()
  const { theme, toggle: toggleTheme } = useTheme()
  const fav = useFavorites()
  const f = useFilters()
  const location = useLocation()
  const navigate = useNavigate()
  const onHome = location.pathname === '/'

  /** Go to a section of the home page, from any page. */
  const goTo = (id: string) => {
    if (onHome) scrollToSection(id)
    else {
      navigate('/')
      setTimeout(() => scrollToSection(id), 80)
    }
  }

  const showFavorites = () => {
    f.clearAll()
    f.setFavoritesOnly(true)
    goTo('recipes')
  }

  /** Jump to the search box above the recipe list. */
  const focusSearch = () => {
    goTo('recipes')
    setTimeout(() => document.getElementById('recipe-search')?.focus({ preventScroll: true }), onHome ? 0 : 120)
  }

  // Ctrl+K / ⌘K jumps to search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        focusSearch()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const navItem = (label: string, onClick: () => void, active = false, icon?: React.ReactNode) => (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[15px] font-medium transition ${
        active ? 'bg-accent-soft text-accent' : 'text-stone-700 hover:bg-stone-100 hover:text-stone-900'
      }`}
    >
      {icon}
      {label}
    </button>
  )

  return (
    <div className="flex min-h-dvh flex-col bg-cream text-stone-800 print:bg-white">
      {/* Soft warm glow behind the top of the page */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[640px] bg-[radial-gradient(ellipse_at_top_left,var(--color-accent-soft),transparent_60%)] opacity-70 print:hidden"
        aria-hidden
      />

      <header className="sticky top-0 z-30 border-b border-stone-200/60 bg-cream/85 backdrop-blur-md print:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:gap-6 lg:px-8">
          <Link to="/" onClick={f.clearAll} className="flex shrink-0 items-center gap-2">
            <CookingPot size={30} className="text-accent" strokeWidth={2.2} />
            <span className="font-display text-xl leading-none font-bold text-stone-900 sm:text-[1.7rem]">
              {d.t.siteName} <span className="text-accent">{d.t.siteNameAccent}</span>
            </span>
          </Link>

          <nav className="ml-2 hidden items-center gap-1 xl:flex" aria-label="Main">
            {navItem(
              d.t.navHome,
              () => {
                f.clearAll()
                if (onHome) window.scrollTo({ top: 0, behavior: 'smooth' })
                else navigate('/')
              },
              onHome && !f.favoritesOnly,
              <House size={18} />,
            )}
            {navItem(d.t.navRecipes, () => goTo('recipes'))}
            {navItem(d.t.navCategories, () => goTo('categories'))}
            {navItem(d.t.navSeasons, () => goTo('seasons'))}
            {navItem(d.t.navContact, () => navigate('/contact'), location.pathname === '/contact')}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={focusSearch}
              aria-label={d.t.searchLabel}
              title={`${d.t.searchLabel} (${d.t.ctrlK})`}
              className="flex h-10 items-center gap-2 rounded-full px-2.5 text-stone-800 transition hover:bg-stone-100 md:border md:border-stone-200 md:bg-surface md:px-4 md:shadow-sm"
            >
              <Search size={19} />
              <span className="hidden text-sm text-stone-500 md:inline">{d.t.searchLabel}</span>
              <kbd className="hidden rounded-md border border-stone-200 bg-stone-50 px-1.5 py-0.5 font-sans text-[11px] text-stone-500 lg:inline">
                {d.t.ctrlK}
              </kbd>
            </button>

            <button
              type="button"
              onClick={showFavorites}
              aria-label={d.t.navFavorites}
              title={d.t.navFavorites}
              className={`relative flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-stone-100 ${
                f.favoritesOnly ? 'bg-accent-soft text-accent' : 'text-stone-800'
              }`}
            >
              <Heart size={21} className={fav.ids.length ? 'fill-accent text-accent' : ''} />
              {fav.ids.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[11px] font-semibold text-white">
                  {fav.ids.length}
                </span>
              )}
            </button>

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
                    d.lang === l ? 'bg-accent text-white' : 'text-stone-600 hover:text-stone-900'
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
              className="flex h-10 w-10 items-center justify-center rounded-full text-stone-800 transition hover:bg-stone-100"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>
      </header>

      <div className="relative flex-1">
        <Routes>
          <Route path="/" element={<HomePage f={f} />} />
          <Route path="/recipe/:id" element={<RecipePage />} />
          <Route
            path="/contact"
            element={
              <Suspense fallback={<div className="min-h-[60vh]" />}>
                <ContactPage />
              </Suspense>
            }
          />
          <Route path="*" element={<RecipePage />} />
        </Routes>
      </div>

      <footer className="relative border-t border-stone-200/70 py-8 text-center text-sm text-stone-500 print:hidden">
        <p className="inline-flex items-center gap-2">
          <CookingPot size={18} className="text-accent" /> {d.t.footer}
        </p>
        <p className="mt-3">
          <Link to="/contact" className="inline-flex items-center gap-1.5 font-medium text-accent hover:underline">
            <Mail size={15} /> {d.t.navContact}
          </Link>
        </p>
        <p className="mt-2 text-xs text-stone-400">{d.t.photosFrom}</p>
      </footer>
    </div>
  )
}

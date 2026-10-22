import {
  CalendarHeart,
  CookingPot,
  Heart,
  House,
  LayoutGrid,
  ListChecks,
  Mail,
  Menu,
  Moon,
  Search,
  Sun,
  UtensilsCrossed,
  X,
} from 'lucide-react'
import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react'
import { Link, Route, Routes, useLocation, useNavigate } from 'react-router'
import { useFavorites } from './favorites'
import { useLang, type Lang } from './i18n'
import HomePage, { scrollToSection } from './pages/HomePage'
import RecipePage from './pages/RecipePage'
import { useTheme } from './theme'
import { useFilters } from './useFilters'

// Loaded only when someone opens the contact page (keeps the main page fast)
const ContactPage = lazy(() => import('./pages/ContactPage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))
const ListsPage = lazy(() => import('./pages/ListsPage'))
const ListPage = lazy(() => import('./pages/ListPage'))

export default function App() {
  const { d, setLang } = useLang()
  const { theme, toggle: toggleTheme } = useTheme()
  const fav = useFavorites()
  const f = useFilters()
  const location = useLocation()
  const navigate = useNavigate()
  const onHome = location.pathname === '/'
  const [menuOpen, setMenuOpen] = useState(false)

  // Close the menu when the page changes, on Escape, and lock page scrolling while it's open
  useEffect(() => setMenuOpen(false), [location.pathname])
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false)
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [menuOpen])

  /** Close the menu first, then run the action once the page can scroll again. */
  const fromMenu = (action: () => void) => () => {
    setMenuOpen(false)
    setTimeout(action, 30)
  }

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

  const goHome = () => {
    f.clearAll()
    if (onHome) window.scrollTo({ top: 0, behavior: 'smooth' })
    else navigate('/')
  }

  /** Seasons are in the sidebar on desktop and in the filters drawer on smaller screens. */
  const goSeasons = () => {
    if (window.matchMedia('(min-width: 1024px)').matches) return goTo('seasons')
    goTo('recipes')
    setTimeout(() => window.dispatchEvent(new Event('open-filters')), onHome ? 350 : 450)
  }

  const navItem = (label: string, onClick: () => void, active = false, icon?: ReactNode) => (
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
            {navItem(d.t.navHome, goHome, onHome && !f.favoritesOnly, <House size={18} />)}
            {navItem(d.t.navRecipes, () => goTo('recipes'))}
            {navItem(d.t.navCategories, () => goTo('categories'))}
            {navItem(d.t.navSeasons, goSeasons)}
            {navItem(d.t.navLists, () => navigate('/lists'), location.pathname.startsWith('/list'))}
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
              <span className="hidden text-sm whitespace-nowrap text-stone-500 md:inline xl:hidden 2xl:inline">{d.t.searchLabel}</span>
              <kbd className="hidden rounded-md border border-stone-200 bg-stone-50 px-1.5 py-0.5 font-sans text-[11px] whitespace-nowrap text-stone-500 lg:inline xl:hidden 2xl:inline">
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
              className="hidden rounded-full border border-stone-200 bg-surface p-0.5 text-xs font-semibold shadow-sm sm:flex"
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
              className="hidden h-10 w-10 items-center justify-center rounded-full text-stone-800 transition hover:bg-stone-100 sm:flex"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label={d.t.menu}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-surface text-stone-800 shadow-sm transition hover:bg-stone-100 xl:hidden"
            >
              <Menu size={21} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile / tablet menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 xl:hidden print:hidden" role="dialog" aria-modal="true" aria-label={d.t.menu}>
          <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" onClick={() => setMenuOpen(false)} />
          <nav
            id="mobile-menu"
            className="animate-slide-in absolute inset-y-0 right-0 flex w-[86%] max-w-sm flex-col rounded-l-3xl bg-cream shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-stone-200/70 px-5 py-4">
              <span className="flex items-center gap-2">
                <CookingPot size={26} className="text-accent" strokeWidth={2.2} />
                <span className="font-display text-xl font-bold text-stone-900">
                  {d.t.siteName} <span className="text-accent">{d.t.siteNameAccent}</span>
                </span>
              </span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label={d.t.closeMenu}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-stone-700 shadow-sm"
              >
                <X size={20} />
              </button>
            </div>

            <ul className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
              {(
                [
                  [d.t.navHome, <House size={21} />, goHome, onHome && !f.favoritesOnly],
                  [d.t.navRecipes, <UtensilsCrossed size={21} />, () => goTo('recipes'), false],
                  [d.t.navCategories, <LayoutGrid size={21} />, () => goTo('categories'), false],
                  [d.t.navSeasons, <CalendarHeart size={21} />, goSeasons, false],
                  [d.t.navFavorites, <Heart size={21} />, showFavorites, f.favoritesOnly],
                  [d.t.navLists, <ListChecks size={21} />, () => navigate('/lists'), location.pathname.startsWith('/list')],
                  [d.t.navContact, <Mail size={21} />, () => navigate('/contact'), location.pathname === '/contact'],
                ] as [string, ReactNode, () => void, boolean][]
              ).map(([label, icon, action, active]) => (
                <li key={label}>
                  <button
                    type="button"
                    onClick={fromMenu(action)}
                    className={`flex w-full items-center gap-4 rounded-2xl px-4 py-3.5 text-left text-lg font-medium transition ${
                      active ? 'bg-accent-soft text-accent' : 'text-stone-800 hover:bg-stone-100'
                    }`}
                  >
                    <span className={active ? 'text-accent' : 'text-stone-500'}>{icon}</span>
                    <span className="flex-1">{label}</span>
                    {label === d.t.navFavorites && fav.ids.length > 0 && (
                      <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-white">
                        {fav.ids.length}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>

            <div className="space-y-4 border-t border-stone-200/70 px-5 py-5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-stone-600">{d.t.language}</span>
                <div className="flex rounded-full border border-stone-200 bg-surface p-0.5 text-sm font-semibold shadow-sm">
                  {(['en', 'uk'] as Lang[]).map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setLang(l)}
                      aria-pressed={d.lang === l}
                      className={`rounded-full px-4 py-1.5 transition ${
                        d.lang === l ? 'bg-accent text-white' : 'text-stone-600'
                      }`}
                    >
                      {l === 'en' ? 'English' : 'Українська'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-stone-600">{d.t.themeLabel}</span>
                <div className="flex rounded-full border border-stone-200 bg-surface p-0.5 text-sm font-semibold shadow-sm">
                  {(['light', 'dark'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => theme !== mode && toggleTheme()}
                      aria-pressed={theme === mode}
                      className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 transition ${
                        theme === mode ? 'bg-accent text-white' : 'text-stone-600'
                      }`}
                    >
                      {mode === 'light' ? <Sun size={15} /> : <Moon size={15} />}
                      {mode === 'light' ? d.t.themeLight : d.t.themeDark}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </nav>
        </div>
      )}

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
          <Route
            path="/lists"
            element={
              <Suspense fallback={<div className="min-h-[60vh]" />}>
                <ListsPage />
              </Suspense>
            }
          />
          <Route
            path="/list/:id"
            element={
              <Suspense fallback={<div className="min-h-[60vh]" />}>
                <ListPage />
              </Suspense>
            }
          />
          <Route
            path="/admin"
            element={
              <Suspense fallback={<div className="min-h-[60vh]" />}>
                <AdminPage />
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
        <p className="mt-3 flex items-center justify-center gap-5">
          <Link to="/lists" className="inline-flex items-center gap-1.5 font-medium text-accent hover:underline">
            <ListChecks size={15} /> {d.t.navLists}
          </Link>
          <Link to="/contact" className="inline-flex items-center gap-1.5 font-medium text-accent hover:underline">
            <Mail size={15} /> {d.t.navContact}
          </Link>
        </p>
        <p className="mt-2 text-xs text-stone-400">{d.t.photosFrom}</p>
      </footer>
    </div>
  )
}

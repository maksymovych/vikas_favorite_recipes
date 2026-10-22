import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { useLang } from '../i18n'
import { CATEGORY_GROUPS, CATEGORY_ICONS, type Category } from '../types'

interface Props {
  value: Category | null
  onChange: (c: Category | null) => void
  counts: Record<Category, number>
}

export default function CategoryBar({ value, onChange, counts }: Props) {
  const { d } = useLang()
  const scroller = useRef<HTMLDivElement>(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(false)

  const update = useCallback(() => {
    const el = scroller.current
    if (!el) return
    setCanLeft(el.scrollLeft > 4)
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }, [])

  useEffect(() => {
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [update, d.lang])

  const scrollBy = (dir: 1 | -1) =>
    scroller.current?.scrollBy({ left: dir * scroller.current.clientWidth * 0.7, behavior: 'smooth' })

  const chip = (c: Category | null) => {
    const active = value === c
    return (
      <button
        key={c ?? 'all'}
        type="button"
        onClick={() => onChange(c)}
        aria-pressed={active}
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition ${
          active
            ? 'border-terracotta bg-terracotta text-white shadow-sm'
            : 'border-stone-200 bg-surface text-stone-700 hover:border-stone-300 hover:bg-stone-100'
        }`}
      >
        <span aria-hidden className="text-base leading-none">
          {c ? CATEGORY_ICONS[c] : '✨'}
        </span>
        {c ? d.category(c) : d.t.allRecipes}
        {c && <span className={`text-xs ${active ? 'text-white/75' : 'text-stone-400'}`}>{counts[c]}</span>}
      </button>
    )
  }

  const arrow = (dir: 1 | -1, show: boolean) => (
    <button
      type="button"
      onClick={() => scrollBy(dir)}
      aria-label={dir === 1 ? 'Scroll right' : 'Scroll left'}
      tabIndex={-1}
      className={`absolute top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-stone-200 bg-surface text-stone-700 shadow-md transition hover:bg-stone-100 sm:flex ${
        dir === 1 ? 'right-0' : 'left-0'
      } ${show ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
    >
      {dir === 1 ? '›' : '‹'}
    </button>
  )

  return (
    <nav aria-label={d.t.categoriesLabel} className="relative -mx-4 mb-6 sm:mx-0">
      {arrow(-1, canLeft)}
      <div
        ref={scroller}
        onScroll={update}
        className="no-scrollbar flex items-center gap-2 overflow-x-auto px-4 py-1 sm:px-10"
        style={{
          maskImage: `linear-gradient(to right, ${canLeft ? 'transparent' : 'black'}, black 48px, black calc(100% - 48px), ${canRight ? 'transparent' : 'black'})`,
        }}
      >
        {chip(null)}
        {CATEGORY_GROUPS.map((group, gi) => (
          <Fragment key={gi}>
            <span aria-hidden className="mx-1 h-6 w-px shrink-0 bg-stone-300" />
            {group.map((c) => chip(c))}
          </Fragment>
        ))}
      </div>
      {arrow(1, canRight)}
    </nav>
  )
}

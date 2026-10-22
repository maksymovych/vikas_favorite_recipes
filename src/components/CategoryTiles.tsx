import { LayoutGrid, X } from 'lucide-react'
import { useState } from 'react'
import { useLang } from '../i18n'
import { CATEGORIES, CATEGORY_ICONS, type Category } from '../types'

const PRIMARY: Category[] = ['Main', 'Borscht', 'Soup', 'Salad', 'Baking', 'Dessert']

interface Props {
  value: Category | null
  onChange: (c: Category | null) => void
  counts: Record<Category, number>
  total: number
}

export default function CategoryTiles({ value, onChange, counts, total }: Props) {
  const { d } = useLang()
  const [expanded, setExpanded] = useState(false)
  const showAll = expanded || (value !== null && !PRIMARY.includes(value))
  const list = showAll ? CATEGORIES : PRIMARY

  const tile = (key: string, icon: string, label: string, sub: string, active: boolean, onClick: () => void) => (
    <button
      key={key}
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex min-w-[150px] shrink-0 items-center gap-3 ${showAll ? "" : "lg:min-w-0"} rounded-2xl border px-3 py-2.5 text-left transition hover:-translate-y-0.5 lg:gap-2 lg:px-2.5 hover:shadow-md ${
        active
          ? 'border-accent bg-accent-soft/60 shadow-sm ring-1 ring-accent'
          : 'border-stone-200/80 bg-surface hover:border-stone-300'
      }`}
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-2xl lg:h-9 lg:w-9 lg:text-xl ${
          active ? 'bg-surface' : 'bg-accent-soft'
        }`}
        aria-hidden
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="line-clamp-2 block text-sm leading-tight font-semibold text-stone-900">{label}</span>
        <span className="block text-xs text-stone-500">{sub}</span>
      </span>
    </button>
  )

  return (
    <nav aria-label={d.t.categoriesLabel} id="categories" className="scroll-mt-28">
      <div
        className={`no-scrollbar -mx-4 flex gap-3 px-4 pt-1 pb-3 sm:mx-0 sm:px-0 ${
          showAll ? 'flex-wrap' : 'overflow-x-auto lg:grid lg:grid-cols-8 lg:overflow-visible'
        }`}
      >
        {tile('all', '🍽️', d.t.allRecipesTile, d.t.recipesCount(total), value === null, () => onChange(null))}
        {list.map((c) =>
          tile(c, CATEGORY_ICONS[c], d.category(c), d.t.recipesCount(counts[c]), value === c, () =>
            onChange(value === c ? null : c),
          ),
        )}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className={`flex min-w-[130px] shrink-0 items-center gap-3 ${showAll ? "" : "lg:min-w-0"} rounded-2xl border border-dashed border-stone-300 bg-transparent px-3 py-2.5 text-left transition hover:border-accent hover:bg-surface`}
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-xl text-stone-700">
            {showAll ? <X size={22} /> : <LayoutGrid size={22} />}
          </span>
          <span>
            <span className="block text-sm font-semibold text-stone-900">
              {showAll ? d.t.fewerCategories : d.t.moreCategories}
            </span>
            <span className="block text-xs text-stone-500">{d.t.moreCategoriesSub}</span>
          </span>
        </button>
      </div>
    </nav>
  )
}

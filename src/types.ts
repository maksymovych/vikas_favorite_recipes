export const CATEGORIES = [
  'Pasta',
  'Main',
  'Soup',
  'Salad',
  'Baking',
  'Dessert',
  'Breakfast',
  'Drinks',
  'Basics & Sauces',
] as const
export type Category = (typeof CATEGORIES)[number]

export const CUISINES = [
  'Ukrainian',
  'Italian',
  'Georgian',
  'American',
  'Greek',
  'Spanish',
  'International',
] as const
export type Cuisine = (typeof CUISINES)[number]

export const SEASONS = [
  'Christmas',
  'New Year',
  'Easter',
  'Thanksgiving',
  'Spring',
  'Summer',
  'Autumn',
  'Winter',
  'Everyday',
] as const
export type Season = (typeof SEASONS)[number]

export type Difficulty = 'Easy' | 'Medium' | 'Hard'

export interface Ingredient {
  /** Short, lowercase name used for filtering, e.g. "egg yolks" */
  name: string
  /** Quantity shown to the reader, e.g. "4" or "200 g" */
  amount: string
  note?: string
}

export interface Recipe {
  id: string
  title: string
  description: string
  emoji: string
  category: Category
  cuisine: Cuisine
  seasons: Season[]
  prepMinutes: number
  cookMinutes: number
  servings: string
  difficulty: Difficulty
  ingredients: Ingredient[]
  steps: string[]
  tips?: string[]
  credit?: string
}

export const SEASON_ICONS: Record<Season, string> = {
  Christmas: '🎄',
  'New Year': '🎆',
  Easter: '🐣',
  Thanksgiving: '🦃',
  Spring: '🌷',
  Summer: '☀️',
  Autumn: '🍂',
  Winter: '❄️',
  Everyday: '🍽️',
}

export const CATEGORY_STYLES: Record<Category, string> = {
  Pasta: 'from-amber-200 to-orange-300',
  Main: 'from-rose-200 to-red-300',
  Soup: 'from-red-200 to-fuchsia-300',
  Salad: 'from-lime-200 to-emerald-300',
  Baking: 'from-yellow-100 to-amber-300',
  Dessert: 'from-pink-200 to-rose-300',
  Breakfast: 'from-orange-100 to-yellow-300',
  Drinks: 'from-sky-200 to-indigo-300',
  'Basics & Sauces': 'from-stone-200 to-amber-200',
}

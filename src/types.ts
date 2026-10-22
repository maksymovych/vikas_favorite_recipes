/** Categories are shown in groups (course → main ingredient → cooking method → diet). */
export const CATEGORY_GROUPS = [
  ['Main', 'Sides', 'Soup', 'Salad', 'Pasta', 'Baking', 'Dessert', 'Breakfast', 'Drinks', 'Basics & Sauces'],
  ['Chicken', 'Beef', 'Pork', 'Seafood', 'Egg', 'Rice'],
  ['Oven', 'Air Fryer', 'Casserole', 'One Pot Meals', 'Grill', 'No-Cook'],
  ['Easy', 'Healthy', 'Vegetarian'],
] as const
export type Category = (typeof CATEGORY_GROUPS)[number][number]
export const CATEGORIES: readonly Category[] = CATEGORY_GROUPS.flat()

export const CATEGORY_ICONS: Record<Category, string> = {
  Main: '🍽️',
  Sides: '🥔',
  Soup: '🍲',
  Salad: '🥗',
  Pasta: '🍝',
  Baking: '🥖',
  Dessert: '🍰',
  Breakfast: '🥞',
  Drinks: '🍹',
  'Basics & Sauces': '🫙',
  Chicken: '🍗',
  Beef: '🥩',
  Pork: '🥓',
  Seafood: '🐟',
  Egg: '🥚',
  Rice: '🍚',
  Oven: '🔥',
  'Air Fryer': '🌀',
  Casserole: '🥘',
  'One Pot Meals': '🍳',
  Grill: '🍖',
  'No-Cook': '🥒',
  Easy: '⚡',
  Healthy: '💚',
  Vegetarian: '🌱',
}

export const CUISINES = [
  'Ukrainian',
  'Italian',
  'Georgian',
  'American',
  'Greek',
  'Spanish',
  'Uzbek',
  'Middle Eastern',
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
  /** Short, lowercase English name used for filtering, e.g. "egg yolks" */
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
  /** First category is the main one (shown on the card); the rest are extra tags. */
  categories: Category[]
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

export interface Photo {
  src: string
  author: string
  license: string
  sourceUrl: string
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

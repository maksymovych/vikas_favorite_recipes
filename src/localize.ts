import { recipesUk } from './data/recipes.uk'
import type { Dict } from './i18n'
import type { Recipe } from './types'

export interface LocalIngredient {
  /** English name, used for filtering */
  name: string
  /** Name in the current language */
  label: string
  amount: string
  note?: string
}

export interface LocalRecipe extends Omit<Recipe, 'ingredients'> {
  ingredients: LocalIngredient[]
}

/** Returns the recipe with all visible text in the current language. */
export function localizeRecipe(r: Recipe, d: Dict): LocalRecipe {
  const uk = d.lang === 'uk' ? recipesUk[r.id] : undefined
  return {
    ...r,
    title: uk?.title ?? r.title,
    description: uk?.description ?? r.description,
    steps: uk?.steps ?? r.steps,
    tips: uk ? uk.tips : r.tips,
    credit: uk?.credit ?? r.credit,
    servings: d.servings(r.servings),
    ingredients: r.ingredients.map((i) => ({
      name: i.name,
      label: d.ingredient(i.name),
      amount: d.amount(i.amount),
      note: i.note && d.note(i.note),
    })),
  }
}

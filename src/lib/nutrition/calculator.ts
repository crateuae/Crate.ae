/**
 * Recipe → nutrition-facts calculator. Pure, faithful to the official UAE recipe
 * template's math:
 *   per-100g   = totalNutrient / recipeWeight × 100
 *   per-serving = per-100g / 100 × servingWeight
 *   %DV        = per-serving / DailyValue × 100
 * Client- or server-safe (no I/O, no external API).
 */
import { NUTRIENTS, NUTRIENT_KEYS } from './reference'

export type NutrientMap = Record<string, number> // keyed by Nutrient.key

export interface Ingredient {
  name: string
  grams: number
  per100g: NutrientMap // nutrient amounts per 100 g of THIS ingredient
}

export interface NutritionFacts {
  servings: number
  servingWeightG: number
  recipeWeightG: number
  total: NutrientMap      // whole recipe
  per100g: NutrientMap
  perServing: NutrientMap
  dvPercent: NutrientMap  // % Daily Value, per serving
}

const round = (n: number, d = 2) => {
  const f = 10 ** d
  return Math.round((n + Number.EPSILON) * f) / f
}

export function computeNutritionFacts(
  ingredients: Ingredient[],
  servings: number,
  servingWeightG: number,
): NutritionFacts {
  const total: NutrientMap = {}
  for (const k of NUTRIENT_KEYS) total[k] = 0

  let recipeWeightG = 0
  for (const ing of ingredients) {
    const g = Number(ing.grams) || 0
    recipeWeightG += g
    const factor = g / 100
    for (const k of NUTRIENT_KEYS) total[k] += (Number(ing.per100g?.[k]) || 0) * factor
  }

  const per100g: NutrientMap = {}
  const perServing: NutrientMap = {}
  const dvPercent: NutrientMap = {}

  for (const n of NUTRIENTS) {
    const t = total[n.key]
    per100g[n.key] = recipeWeightG ? round(t / recipeWeightG * 100) : 0
    perServing[n.key] = round(per100g[n.key] / 100 * (Number(servingWeightG) || 0))
    dvPercent[n.key] = n.dv ? Math.round(perServing[n.key] / n.dv * 100) : 0
    total[n.key] = round(t)
  }

  return {
    servings: Number(servings) || 1,
    servingWeightG: round(Number(servingWeightG) || 0),
    recipeWeightG: round(recipeWeightG),
    total, per100g, perServing, dvPercent,
  }
}

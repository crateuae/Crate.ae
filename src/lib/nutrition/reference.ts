/**
 * UAE / GCC nutrition-facts reference.
 *
 * Mirrors the official FoodWatch-style recipe nutrition calculator: the same 11
 * nutrients and Daily Values used on GCC/ESMA nutrition labels. Daily Values
 * follow the US FDA 2016 basis (2,000 kcal reference), which the UAE recipe
 * template adopts.
 *
 * Sources: US FDA 21 CFR 101.9 (Daily Values); UAE FoodWatch recipe calculation
 * template; WHO nutrient-intake guidance. These are LABELLING references — for a
 * binding registration verdict, ESMA remains the authority.
 */

export interface Nutrient {
  key: string
  ar: string
  en: string
  unit: 'kcal' | 'g' | 'mg'
  dv: number | null // Daily Value (per-day reference); null = no established DV
}

// Order matches the official label / recipe template, left to right.
export const NUTRIENTS: Nutrient[] = [
  { key: 'calories',      ar: 'السعرات الحرارية', en: 'Calories',      unit: 'kcal', dv: 2000 },
  { key: 'protein',       ar: 'البروتين',         en: 'Protein',       unit: 'g',    dv: 50 },
  { key: 'fat',           ar: 'الدهون',           en: 'Total Fat',     unit: 'g',    dv: 78 },
  { key: 'carbohydrate',  ar: 'النشويات',         en: 'Carbohydrate',  unit: 'g',    dv: 275 },
  { key: 'fiber',         ar: 'الألياف الغذائية', en: 'Dietary Fiber', unit: 'g',    dv: 28 },
  { key: 'total_sugar',   ar: 'مجموع السكر',      en: 'Total Sugars',  unit: 'g',    dv: null },
  { key: 'added_sugar',   ar: 'السكر المضاف',     en: 'Added Sugars',  unit: 'g',    dv: 50 },
  { key: 'sodium',        ar: 'الصوديوم',         en: 'Sodium',        unit: 'mg',   dv: 2300 },
  { key: 'saturated_fat', ar: 'الدهون المشبعة',   en: 'Saturated Fat', unit: 'g',    dv: 20 },
  { key: 'trans_fat',     ar: 'الدهون المتحولة',  en: 'Trans Fat',     unit: 'g',    dv: null },
  { key: 'cholesterol',   ar: 'الكولسترول',       en: 'Cholesterol',   unit: 'mg',   dv: 300 },
]

export const NUTRIENT_KEYS = NUTRIENTS.map(n => n.key)
export const nutrientByKey = (key: string) => NUTRIENTS.find(n => n.key === key)

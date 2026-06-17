/**
 * Shared packaging specifications + options.
 * Used by the public packaging calculator and (later) the admin packaging dashboard.
 *
 * All prices are APPROXIMATE wholesale UAE market estimates (AED) and are meant
 * to be overridable by the admin. They give the buyer a realistic ballpark before
 * requesting a formal quote through Crate.
 */

// ─── Primary packaging (what the product itself goes into) ───────────────────

export interface PrimaryPack {
  id: string
  type: 'bag' | 'bottle' | 'jar' | 'box' | 'pouch' | 'can'
  type_ar: string
  type_en: string
  icon: string
  size_label: string          // e.g. "1kg", "500ml"
  size_value: number          // numeric size in kg or L
  unit: 'kg' | 'L'
  cost_aed: number            // approx cost per empty primary unit (material + label + seal)
  material_ar: string
  material_en: string
}

export const PRIMARY_PACKS: PrimaryPack[] = [
  { id: 'pp-bag-100g', type: 'bag', type_ar: 'كيس', type_en: 'Bag', icon: '👜', size_label: '100g', size_value: 0.1, unit: 'kg', cost_aed: 0.25, material_ar: 'بولي بروبيلين / لامينيت', material_en: 'PP / Laminate' },
  { id: 'pp-bag-250g', type: 'bag', type_ar: 'كيس', type_en: 'Bag', icon: '👜', size_label: '250g', size_value: 0.25, unit: 'kg', cost_aed: 0.30, material_ar: 'بولي بروبيلين / لامينيت', material_en: 'PP / Laminate' },
  { id: 'pp-bag-500g', type: 'bag', type_ar: 'كيس', type_en: 'Bag', icon: '👜', size_label: '500g', size_value: 0.5, unit: 'kg', cost_aed: 0.40, material_ar: 'بولي بروبيلين منسوج', material_en: 'PP Woven' },
  { id: 'pp-bag-1kg',  type: 'bag', type_ar: 'كيس', type_en: 'Bag', icon: '🛍️', size_label: '1kg',  size_value: 1,   unit: 'kg', cost_aed: 0.55, material_ar: 'بولي بروبيلين منسوج', material_en: 'PP Woven' },
  { id: 'pp-bag-2kg',  type: 'bag', type_ar: 'كيس', type_en: 'Bag', icon: '🛍️', size_label: '2kg',  size_value: 2,   unit: 'kg', cost_aed: 0.75, material_ar: 'بولي بروبيلين منسوج', material_en: 'PP Woven' },
  { id: 'pp-bag-5kg',  type: 'bag', type_ar: 'كيس', type_en: 'Bag', icon: '🛍️', size_label: '5kg',  size_value: 5,   unit: 'kg', cost_aed: 1.30, material_ar: 'بولي بروبيلين منسوج', material_en: 'PP Woven' },
  { id: 'pp-bag-10kg', type: 'bag', type_ar: 'كيس', type_en: 'Bag', icon: '🧺', size_label: '10kg', size_value: 10,  unit: 'kg', cost_aed: 2.00, material_ar: 'بولي بروبيلين منسوج', material_en: 'PP Woven' },
  { id: 'pp-bot-500',  type: 'bottle', type_ar: 'زجاجة', type_en: 'Bottle', icon: '🍶', size_label: '500ml', size_value: 0.5, unit: 'L', cost_aed: 1.00, material_ar: 'PET', material_en: 'PET' },
  { id: 'pp-bot-1l',   type: 'bottle', type_ar: 'زجاجة', type_en: 'Bottle', icon: '🍶', size_label: '1L',  size_value: 1, unit: 'L', cost_aed: 1.50, material_ar: 'PET', material_en: 'PET' },
  { id: 'pp-jar-500',  type: 'jar', type_ar: 'برطمان', type_en: 'Jar', icon: '🫙', size_label: '500g', size_value: 0.5, unit: 'kg', cost_aed: 1.60, material_ar: 'PET / زجاج', material_en: 'PET / Glass' },
  { id: 'pp-box-1kg',  type: 'box', type_ar: 'علبة', type_en: 'Box', icon: '📦', size_label: '1kg', size_value: 1, unit: 'kg', cost_aed: 2.80, material_ar: 'كرتون مطبوع', material_en: 'Printed carton' },
]

// ─── Master cartons (the shipping/storage carton) ────────────────────────────

export interface MasterCarton {
  id: string
  name_ar: string
  name_en: string
  icon: string
  /** internal dimensions in cm */
  l_cm: number
  w_cm: number
  h_cm: number
  max_weight_kg: number
  /** how many primary units of a *reference* fit — used as fallback when volume calc isn't possible */
  default_units: number
  cartons_per_pallet: number
  flute_ar: string
  flute_en: string
  cost_aed: number
}

export const MASTER_CARTONS: MasterCarton[] = [
  { id: 'mc-s', name_ar: 'كرتون صغير', name_en: 'Small Carton', icon: '📦', l_cm: 30, w_cm: 20, h_cm: 15, max_weight_kg: 12, default_units: 12, cartons_per_pallet: 80, flute_ar: 'مموج B (جدار مفرد)', flute_en: 'B-flute (single wall)', cost_aed: 3.5 },
  { id: 'mc-m', name_ar: 'كرتون متوسط', name_en: 'Medium Carton', icon: '📦', l_cm: 40, w_cm: 30, h_cm: 20, max_weight_kg: 20, default_units: 24, cartons_per_pallet: 50, flute_ar: 'مموج C (جدار مفرد)', flute_en: 'C-flute (single wall)', cost_aed: 5.0 },
  { id: 'mc-l', name_ar: 'كرتون كبير', name_en: 'Large Carton', icon: '🗃️', l_cm: 60, w_cm: 40, h_cm: 30, max_weight_kg: 30, default_units: 48, cartons_per_pallet: 30, flute_ar: 'مموج BC (جدار مزدوج)', flute_en: 'BC-flute (double wall)', cost_aed: 8.0 },
  { id: 'mc-xl', name_ar: 'كرتون كبير جداً', name_en: 'XL Carton', icon: '🗃️', l_cm: 60, w_cm: 40, h_cm: 40, max_weight_kg: 40, default_units: 60, cartons_per_pallet: 24, flute_ar: 'مموج BC (جدار مزدوج)', flute_en: 'BC-flute (double wall)', cost_aed: 10.5 },
]

// ─── Packaging options / specs (toggles that modify cost) ────────────────────

export interface PackagingOption {
  id: string
  label_ar: string
  label_en: string
  /** multiplier applied to carton cost (1 = no change) */
  carton_mult: number
  /** flat add per primary unit (AED) */
  per_unit_add: number
  /** one-time setup fee (AED) — e.g. print plates */
  setup_aed: number
}

export const PACKAGING_OPTIONS: PackagingOption[] = [
  { id: 'double-wall',  label_ar: 'جدار مزدوج (Double Wall)',     label_en: 'Double Wall',        carton_mult: 1.30, per_unit_add: 0,    setup_aed: 0 },
  { id: 'recyclable',   label_ar: '100% قابل لإعادة التدوير',     label_en: '100% Recyclable',    carton_mult: 1.10, per_unit_add: 0,    setup_aed: 0 },
  { id: 'food-grade',   label_ar: 'مبطّن غذائي (Food Grade)',     label_en: 'Food-Grade Liner',   carton_mult: 1.05, per_unit_add: 0.05, setup_aed: 0 },
  { id: 'moisture',     label_ar: 'مقاوم للرطوبة',                label_en: 'Moisture Resistant', carton_mult: 1.08, per_unit_add: 0,    setup_aed: 0 },
  { id: 'custom-print', label_ar: 'طباعة مخصصة (لوغو/ليبل)',      label_en: 'Custom Print',       carton_mult: 1.15, per_unit_add: 0.08, setup_aed: 1200 },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

export const PALLET_FOOTPRINT_M2 = 0.96   // standard 120×80 cm pallet

export function cartonVolumeM3(c: Pick<MasterCarton, 'l_cm' | 'w_cm' | 'h_cm'>): number {
  return (c.l_cm * c.w_cm * c.h_cm) / 1_000_000
}

export interface PackagingCalcInput {
  totalWeightKg: number | null     // for weight-based products
  totalUnits: number | null        // for unit-based products (overrides weight path)
  primary: PrimaryPack | null
  carton: MasterCarton
  options: PackagingOption[]
}

export interface PackagingCalcResult {
  primaryUnits: number             // total primary packs (bags/bottles)
  unitsPerCarton: number
  totalCartons: number
  pallets: number
  storageVolumeM3: number
  floorAreaM2: number
  primaryCostAed: number
  cartonCostAed: number
  optionsSetupAed: number
  totalPackagingAed: number
  costPerPrimaryUnit: number
}

/**
 * Core packaging math. Weight path: totalWeightKg + primary.size_value → primaryUnits.
 * Unit path: totalUnits directly. Cartons derived by both weight capacity and the
 * carton's default unit count (whichever is the binding constraint).
 */
export function calcPackaging(input: PackagingCalcInput): PackagingCalcResult | null {
  const { totalWeightKg, totalUnits, primary, carton, options } = input

  // Determine number of primary units
  let primaryUnits = 0
  let primaryUnitWeight = 0
  if (totalUnits && totalUnits > 0) {
    primaryUnits = Math.floor(totalUnits)
    primaryUnitWeight = primary?.size_value ?? 0
  } else if (totalWeightKg && totalWeightKg > 0 && primary && primary.size_value > 0) {
    primaryUnits = Math.floor(totalWeightKg / primary.size_value)
    primaryUnitWeight = primary.size_value
  } else if (totalWeightKg && totalWeightKg > 0 && !primary) {
    // No primary pack: cartons hold loose weight directly
    primaryUnits = 0
    primaryUnitWeight = 0
  } else {
    return null
  }

  // Units per carton — limited by weight capacity if we know unit weight
  let unitsPerCarton = carton.default_units
  if (primaryUnitWeight > 0) {
    const byWeight = Math.floor(carton.max_weight_kg / primaryUnitWeight)
    unitsPerCarton = Math.max(1, Math.min(carton.default_units, byWeight))
  }

  // Total cartons
  let totalCartons: number
  if (primaryUnits > 0) {
    totalCartons = Math.ceil(primaryUnits / unitsPerCarton)
  } else if (totalWeightKg) {
    totalCartons = Math.ceil(totalWeightKg / carton.max_weight_kg)
  } else {
    return null
  }

  const pallets = Math.ceil(totalCartons / carton.cartons_per_pallet)
  const storageVolumeM3 = +(totalCartons * cartonVolumeM3(carton)).toFixed(2)
  const floorAreaM2 = +(pallets * PALLET_FOOTPRINT_M2).toFixed(2)

  // Cost — apply option multipliers/adds
  const cartonMult = options.reduce((m, o) => m * o.carton_mult, 1)
  const perUnitAdd = options.reduce((a, o) => a + o.per_unit_add, 0)
  const optionsSetupAed = options.reduce((a, o) => a + o.setup_aed, 0)

  const cartonCostAed  = +(totalCartons * carton.cost_aed * cartonMult).toFixed(2)
  const primaryUnitCost = (primary?.cost_aed ?? 0) + perUnitAdd
  const primaryCostAed = +(primaryUnits * primaryUnitCost).toFixed(2)
  const totalPackagingAed = +(cartonCostAed + primaryCostAed + optionsSetupAed).toFixed(2)
  const costPerPrimaryUnit = primaryUnits > 0
    ? +((cartonCostAed + primaryCostAed + optionsSetupAed) / primaryUnits).toFixed(3)
    : 0

  return {
    primaryUnits,
    unitsPerCarton,
    totalCartons,
    pallets,
    storageVolumeM3,
    floorAreaM2,
    primaryCostAed,
    cartonCostAed,
    optionsSetupAed,
    totalPackagingAed,
    costPerPrimaryUnit,
  }
}

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
  weight_kg?: number | null   // empty weight of one primary pack (kg)
  image_url?: string | null
  material_ar: string
  material_en: string
  suitable_for_ar?: string
  suitable_for_en?: string
  is_active?: boolean
  sort_order?: number
}

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
  empty_weight_kg?: number | null
  /** how many primary units of a *reference* fit — used as fallback when volume calc isn't possible */
  default_units: number
  cartons_per_pallet: number
  flute_ar: string
  flute_en: string
  cost_aed: number
  image_url?: string | null
  suitable_for_ar?: string
  suitable_for_en?: string
  is_active?: boolean
  sort_order?: number
}

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
  is_active?: boolean
  sort_order?: number
}

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

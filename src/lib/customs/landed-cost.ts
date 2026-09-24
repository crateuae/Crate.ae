/**
 * Landed-cost model for UAE imports (deterministic). Review date 2026-09-24.
 *   CIF   = goods + freight + insurance
 *   duty  = CIF × rate (GCC unified: 5% standard; 0% food-security exemptions; 50% alcohol; 100% tobacco)
 *   excise (Cabinet Decision 197/2025, in force 1 Jan 2026):
 *     energy drinks & tobacco/e-smoking = 100% of the excise price. For percentage-rate goods the excise
 *     price is derived from the retail selling price: excise = RSP / 2 (RSP includes the tax).
 *     sweetened drinks = volumetric by sugar: <5 g/100 ml → 0; 5–<8 g → AED 0.79/L; ≥8 g → AED 1.09/L
 *   VAT   = 5% × (CIF + duty + excise)      — VAT applies on top of excise
 *   landed = CIF + duty + excise + VAT + local costs (clearance, transport, registration/labels)
 * VAT is usually recoverable for a VAT-registered importer; shown separately for that reason.
 */
import type { Duty, Excise } from './hs-fmcg'

export interface CostInput {
  goodsValue: number       // FOB/EXW value in AED
  freight: number          // AED
  insurance: number        // AED
  units: number            // sellable units in the shipment
  duty: Duty
  dutyOverride?: number | null   // when duty is 'verify', the user picks 0 or 5
  excise: Excise
  litres?: number          // total litres (sweetened drinks)
  sugarPer100ml?: number   // g per 100 ml (sweetened drinks)
  retailPricePerUnit?: number // AED incl. tax (energy / tobacco)
  clearance: number        // customs broker, port, inspection — AED
  transport: number        // inland transport / warehouse — AED
  compliance: number       // registration, label translation/printing, lab tests — AED
  vatRegistered: boolean   // recoverable input VAT
  targetMarginPct: number  // desired gross margin on selling price
}

export interface CostResult {
  cif: number
  dutyRate: number
  duty: number
  excise: number
  exciseBasis: 'none' | 'volumetric' | 'retail_half'
  exciseTier?: string
  vat: number
  local: number
  landedExVat: number
  landedTotal: number
  perUnitExVat: number
  perUnitTotal: number
  suggestedPrice: number     // ex-VAT price per unit achieving the target margin
  suggestedPriceIncVat: number
  effectiveRatePct: number   // (landedExVat − goods) / goods
}

export const sweetTier = (sugar: number) => (sugar < 5 ? 0 : sugar < 8 ? 0.79 : 1.09)

export function computeLandedCost(i: CostInput): CostResult {
  const goods = Math.max(0, i.goodsValue || 0)
  const cif = goods + Math.max(0, i.freight || 0) + Math.max(0, i.insurance || 0)
  const dutyRate = i.duty === 'verify' ? (i.dutyOverride ?? 5) : i.duty
  const duty = cif * dutyRate / 100

  let excise = 0
  let exciseBasis: CostResult['exciseBasis'] = 'none'
  let exciseTier: string | undefined
  if (i.excise === 'sweet') {
    const rate = sweetTier(i.sugarPer100ml ?? 0)
    excise = rate * Math.max(0, i.litres ?? 0)
    exciseBasis = 'volumetric'
    exciseTier = `AED ${rate.toFixed(2)}/L`
  } else if (i.excise === 'energy' || i.excise === 'tobacco') {
    const rsp = Math.max(0, i.retailPricePerUnit ?? 0) * Math.max(0, i.units || 0)
    excise = rsp / 2
    exciseBasis = 'retail_half'
    exciseTier = '100%'
  }

  const vat = 0.05 * (cif + duty + excise)
  const local = Math.max(0, i.clearance || 0) + Math.max(0, i.transport || 0) + Math.max(0, i.compliance || 0)
  const landedExVat = cif + duty + excise + local
  const landedTotal = landedExVat + vat
  const units = Math.max(1, Math.floor(i.units || 1))
  const perUnitExVat = landedExVat / units
  const perUnitTotal = landedTotal / units
  // Cost basis for pricing: VAT-registered importers recover VAT, so price from the ex-VAT cost.
  const basis = i.vatRegistered ? perUnitExVat : perUnitTotal
  const m = Math.min(0.95, Math.max(0, (i.targetMarginPct || 0) / 100))
  const suggestedPrice = m >= 0.95 ? basis * 20 : basis / (1 - m)
  return {
    cif, dutyRate, duty, excise, exciseBasis, exciseTier, vat, local, landedExVat, landedTotal,
    perUnitExVat, perUnitTotal, suggestedPrice, suggestedPriceIncVat: suggestedPrice * 1.05,
    effectiveRatePct: goods > 0 ? ((landedExVat - goods) / goods) * 100 : 0,
  }
}

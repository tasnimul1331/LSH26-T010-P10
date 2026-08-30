import { TariffConfig, SlabSlice } from "@/types";
import { Money, roundBDT } from "../utils/money";

export interface DailyEnergyCalculation {
  energy_cost_bdt: number;
  slab_slices: SlabSlice[];
  running_units_before: number;
  running_units_after: number;
}

/**
 * Calculate the energy cost for a single day's unit consumption
 * by slicing the consumption across the applicable tariff slabs.
 *
 * @param dailyUnits Units (kWh) consumed on this day
 * @param monthlyRunningUnitsBefore Total units consumed in current calendar month before this day
 * @param tariff Active tariff configuration
 */
export function calculateDailyEnergyCost(
  dailyUnits: number,
  monthlyRunningUnitsBefore: number,
  tariff: TariffConfig
): DailyEnergyCalculation {
  if (dailyUnits <= 0) {
    return {
      energy_cost_bdt: 0,
      slab_slices: [],
      running_units_before: monthlyRunningUnitsBefore,
      running_units_after: monthlyRunningUnitsBefore,
    };
  }

  const startUnit = monthlyRunningUnitsBefore + 1;
  const endUnit = monthlyRunningUnitsBefore + dailyUnits;
  const slices: SlabSlice[] = [];
  let totalEnergyCents = 0;

  for (const slab of tariff.slabs) {
    const slabMin = slab.min_units;
    const slabMax = slab.max_units !== null ? slab.max_units : Infinity;

    // Calculate overlap between [startUnit, endUnit] and [slabMin, slabMax]
    const overlapStart = Math.max(startUnit, slabMin);
    const overlapEnd = Math.min(endUnit, slabMax);

    if (overlapStart <= overlapEnd) {
      const unitsInSlab = overlapEnd - overlapStart + 1;
      const rateBDT = slab.rate_per_unit_bdt;
      // Exact paisa calculation for this slice
      const sliceCostCents = Math.round(unitsInSlab * rateBDT * 100);
      totalEnergyCents += sliceCostCents;

      slices.push({
        slab_id: slab.slab_id,
        slab_name: slab.name,
        units: unitsInSlab,
        rate: rateBDT,
        cost_bdt: sliceCostCents / 100,
      });
    }
  }

  const totalEnergyBDT = totalEnergyCents / 100;

  return {
    energy_cost_bdt: totalEnergyBDT,
    slab_slices: slices,
    running_units_before: monthlyRunningUnitsBefore,
    running_units_after: endUnit,
  };
}

/**
 * Calculate the monthly fixed charges (Demand Charge + Meter Rent).
 */
export function calculateMonthlyFixedCharges(
  tariff: TariffConfig,
  sanctionedLoadKw = 1.0
): { demand_charge_bdt: number; meter_rent_bdt: number; total_fixed_charges_bdt: number } {
  const demandCharge = roundBDT(tariff.demand_charge_bdt_per_kw_month * sanctionedLoadKw);
  const meterRent = roundBDT(tariff.meter_rent_bdt_per_month);
  const total = roundBDT(demandCharge + meterRent);

  return {
    demand_charge_bdt: demandCharge,
    meter_rent_bdt: meterRent,
    total_fixed_charges_bdt: total,
  };
}

/**
 * Calculate VAT on the taxable base (energy cost + applicable fixed charges).
 */
export function calculateVAT(
  energyCostBDT: number,
  fixedChargesBDT: number,
  vatPercentage: number
): number {
  if (vatPercentage <= 0) return 0;
  const taxableBaseCents = Math.round((energyCostBDT + fixedChargesBDT) * 100);
  const vatCents = Math.round(taxableBaseCents * (vatPercentage / 100));
  return vatCents / 100;
}

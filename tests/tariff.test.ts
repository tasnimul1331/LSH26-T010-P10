import { describe, it, expect } from "vitest";
import { TariffConfig } from "@/types";
import {
  calculateDailyEnergyCost,
  calculateMonthlyFixedCharges,
  calculateVAT,
} from "@/lib/engine/tariff-engine";

const mockTariff: TariffConfig = {
  tariff_version: "v1.0-test",
  effective_date: "2024-03-01",
  name: "Test Tariff",
  description: "Test Tariff Spec",
  currency: "BDT",
  slabs: [
    { slab_id: "s1", name: "Slab 1", min_units: 0, max_units: 75, rate_per_unit_bdt: 5.0 },
    { slab_id: "s2", name: "Slab 2", min_units: 76, max_units: 200, rate_per_unit_bdt: 7.0 },
    { slab_id: "s3", name: "Slab 3", min_units: 201, max_units: 300, rate_per_unit_bdt: 8.0 },
    { slab_id: "s4", name: "Slab 4", min_units: 301, max_units: null, rate_per_unit_bdt: 12.0 },
  ],
  demand_charge_bdt_per_kw_month: 42.0,
  meter_rent_bdt_per_month: 40.0,
  sanctioned_load_kw_default: 1.0,
  vat_percentage: 5.0,
  fixed_charge_application: "first_recharge_of_month",
  base_slab_rate_for_breakdown: 5.0,
  rounding_precision_decimals: 2,
  is_configured: true,
};

describe("Tariff Engine - Slab Calculation", () => {
  it("prices units solely within Slab 1", () => {
    // 50 units starting at 0: all in Slab 1 (rate 5.0) -> 50 * 5 = 250.00
    const res = calculateDailyEnergyCost(50, 0, mockTariff);
    expect(res.energy_cost_bdt).toBe(250.0);
    expect(res.slab_slices.length).toBe(1);
    expect(res.slab_slices[0].units).toBe(50);
    expect(res.slab_slices[0].rate).toBe(5.0);
    expect(res.running_units_after).toBe(50);
  });

  it("splits a single day across Slab 1 and Slab 2 boundaries", () => {
    // Starting at 70 units, consuming 15 units -> 5 units in Slab 1 (71-75), 10 units in Slab 2 (76-85)
    // 5 * 5.0 = 25.00, 10 * 7.0 = 70.00 -> Total = 95.00
    const res = calculateDailyEnergyCost(15, 70, mockTariff);
    expect(res.energy_cost_bdt).toBe(95.0);
    expect(res.slab_slices.length).toBe(2);
    expect(res.slab_slices[0].units).toBe(5);
    expect(res.slab_slices[0].rate).toBe(5.0);
    expect(res.slab_slices[1].units).toBe(10);
    expect(res.slab_slices[1].rate).toBe(7.0);
    expect(res.running_units_after).toBe(85);
  });

  it("prices units in open-ended top slab (>300 units)", () => {
    // Starting at 350 units, consuming 20 units -> all in Slab 4 (rate 12.0) -> 20 * 12 = 240.00
    const res = calculateDailyEnergyCost(20, 350, mockTariff);
    expect(res.energy_cost_bdt).toBe(240.0);
    expect(res.slab_slices.length).toBe(1);
    expect(res.slab_slices[0].units).toBe(20);
    expect(res.slab_slices[0].rate).toBe(12.0);
  });
});

describe("Tariff Engine - Fixed Charges & VAT", () => {
  it("computes monthly fixed charges accurately", () => {
    const fixed = calculateMonthlyFixedCharges(mockTariff, 1.0);
    expect(fixed.demand_charge_bdt).toBe(42.0);
    expect(fixed.meter_rent_bdt).toBe(40.0);
    expect(fixed.total_fixed_charges_bdt).toBe(82.0);
  });

  it("computes 5% VAT with exact half-up rounding", () => {
    // Energy 100, Fixed 0 -> Base 100 * 5% = 5.00
    expect(calculateVAT(100.0, 0, 5.0)).toBe(5.0);

    // Energy 100, Fixed 82 -> Base 182 * 5% = 9.10
    expect(calculateVAT(100.0, 82.0, 5.0)).toBe(9.1);

    // Fractional: Base 33.33 * 5% = 1.6665 -> 1.67
    expect(calculateVAT(33.33, 0, 5.0)).toBe(1.67);
  });
});

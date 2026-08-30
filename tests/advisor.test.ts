import { describe, it, expect } from "vitest";
import { CaseData, TariffConfig } from "@/types";
import {
  calculateDepletionForecast,
  calculateTargetRecharge,
} from "@/lib/engine/advisor-engine";

const testTariff: TariffConfig = {
  tariff_version: "v1.0-test",
  effective_date: "2024-03-01",
  name: "Test Tariff",
  description: "Test Tariff",
  currency: "BDT",
  slabs: [
    { slab_id: "s1", name: "Slab 1", min_units: 0, max_units: 75, rate_per_unit_bdt: 5.0 },
    { slab_id: "s2", name: "Slab 2", min_units: 76, max_units: 200, rate_per_unit_bdt: 7.0 },
  ],
  demand_charge_bdt_per_kw_month: 40.0,
  meter_rent_bdt_per_month: 40.0,
  sanctioned_load_kw_default: 1.0,
  vat_percentage: 5.0,
  fixed_charge_application: "first_recharge_of_month",
  base_slab_rate_for_breakdown: 5.0,
  rounding_precision_decimals: 2,
  is_configured: true,
};

describe("Advisor Engine - Depletion & Target Recharge", () => {
  const testCase: CaseData = {
    case_id: "TEST-ADVISOR",
    opening_balance_bdt: "200.00",
    days: [
      { date: "2026-01-01", units: 10 },
      { date: "2026-01-02", units: 10 },
    ],
    recharges: [],
    today: "2026-01-02",
    usual_daily_units: 10,
    target_date: "2026-01-10",
    comparison: {
      months: ["2026-01", "2026-02", "2026-03"],
      source: "readings",
      daily_units: null,
      opening_balance_bdt: "0.00",
      low_threshold_bdt: "100.00",
      low_amount_bdt: "500.00",
      monthly_amount_bdt: "500.00",
    },
  };

  it("calculates depletion date deterministically", () => {
    // Opening balance: 200. Day 1: 10 units -> 50 + 2.50 VAT = 52.50. Bal = 147.50
    // Day 2: 10 units -> 50 + 2.50 VAT = 52.50. Bal = 95.00
    // Today closing balance = 95.00
    // Future: Day 3 (Jan 03): 52.50 -> Bal = 42.50
    // Day 4 (Jan 04): 52.50 -> Bal = -10.00 (Depleted on Jan 04!)
    const forecast = calculateDepletionForecast(testCase, testTariff);
    expect(forecast.current_balance_bdt).toBe(95.0);
    expect(forecast.depletion_date).toBe("2026-01-04");
    expect(forecast.days_remaining).toBe(2);
  });

  it("guarantees 4-part cost decomposition sum equality", () => {
    const targetRes = calculateTargetRecharge(testCase, testTariff, "2026-01-10");
    const b = targetRes.breakdown;

    const reconstructedSum =
      b.energy_cost_base_bdt +
      b.higher_slab_effect_bdt +
      b.fixed_charges_bdt +
      b.vat_bdt;

    expect(Math.abs(reconstructedSum - b.total_projected_cost_bdt)).toBeLessThan(0.01);
  });
});

import { describe, it, expect } from "vitest";
import { CaseData, TariffConfig } from "@/types";
import { compareRechargeStrategies } from "@/lib/engine/comparison-engine";

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

describe("Comparison Engine - Strategy Comparison & Invariants", () => {
  it("strictly enforces identical energy cost across both strategies (Delta = 0.00)", () => {
    const sampleCase: CaseData = {
      case_id: "TEST-COMP",
      opening_balance_bdt: "0.00",
      days: [
        { date: "2026-04-01", units: 10 },
        { date: "2026-04-02", units: 10 },
        { date: "2026-05-01", units: 15 },
        { date: "2026-05-02", units: 15 },
        { date: "2026-06-01", units: 20 },
        { date: "2026-06-02", units: 20 },
      ],
      recharges: [],
      today: "2026-06-02",
      usual_daily_units: 15,
      target_date: "2026-06-20",
      comparison: {
        months: ["2026-04", "2026-05", "2026-06"],
        source: "readings",
        daily_units: null,
        opening_balance_bdt: "0.00",
        low_threshold_bdt: "100.00",
        low_amount_bdt: "1000.00",
        monthly_amount_bdt: "1000.00",
      },
    };

    const comp = compareRechargeStrategies(sampleCase, testTariff);
    expect(comp.invariant_check_passed).toBe(true);
    expect(comp.energy_cost_difference_bdt).toBe(0);
    expect(comp.low_balance_strategy.total_energy_cost_bdt).toBe(
      comp.monthly_strategy.total_energy_cost_bdt
    );
  });

  it("accurately detects equal cost ties when both strategies recharge in all 3 months", () => {
    const tieCase: CaseData = {
      case_id: "TEST-TIE",
      opening_balance_bdt: "0.00",
      days: [
        // Heavy daily consumption so low balance triggers recharge in each month
        { date: "2026-04-01", units: 50 },
        { date: "2026-05-01", units: 50 },
        { date: "2026-06-01", units: 50 },
      ],
      recharges: [],
      today: "2026-06-01",
      usual_daily_units: 50,
      target_date: "2026-06-20",
      comparison: {
        months: ["2026-04", "2026-05", "2026-06"],
        source: "readings",
        daily_units: null,
        opening_balance_bdt: "0.00",
        low_threshold_bdt: "100.00",
        low_amount_bdt: "150.00",
        monthly_amount_bdt: "150.00",
      },
    };

    const comp = compareRechargeStrategies(tieCase, testTariff);
    // Both trigger recharges in Month 4, 5, and 6 -> identical fixed charges -> exact tie!
    expect(comp.is_tie).toBe(true);
    expect(comp.cheaper_strategy).toBe("equal");
    expect(comp.cost_difference_bdt).toBe(0);
    expect(comp.verdict_message).toContain("Equal cost");
  });

  it("accurately identifies fixed-charge variance when one strategy skips a monthly recharge", () => {
    const skipCase: CaseData = {
      case_id: "TEST-SKIP",
      opening_balance_bdt: "0.00",
      days: [
        { date: "2026-04-01", units: 5 },
        { date: "2026-05-01", units: 5 },
        { date: "2026-06-01", units: 5 },
      ],
      recharges: [],
      today: "2026-06-01",
      usual_daily_units: 5,
      target_date: "2026-06-20",
      comparison: {
        months: ["2026-04", "2026-05", "2026-06"],
        source: "readings",
        daily_units: null,
        opening_balance_bdt: "0.00",
        low_threshold_bdt: "50.00",
        low_amount_bdt: "2000.00",
        monthly_amount_bdt: "500.00",
      },
    };

    const comp = compareRechargeStrategies(skipCase, testTariff);
    // Strategy A recharges 2000 in Apr, so balance is > 1900 in May and Jun -> 0 recharges in May & Jun
    // Strategy B recharges on 1st of Apr, May, and Jun -> 3x fixed charges
    // Strategy A saves 2x fixed charges (160 BDT + 8 BDT VAT = 168 BDT)!
    expect(comp.is_tie).toBe(false);
    expect(comp.cheaper_strategy).toBe("low_balance");
    expect(comp.cost_difference_bdt).toBe(-168.0);
    expect(comp.energy_cost_difference_bdt).toBe(0); // Energy cost is STILL identical!
  });
});

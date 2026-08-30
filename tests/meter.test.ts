import { describe, it, expect } from "vitest";
import { CaseData, TariffConfig } from "@/types";
import { simulateMeter } from "@/lib/engine/meter-engine";

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

describe("Meter Engine - Balance Reconstruction", () => {
  it("applies first-recharge fixed charges only once per month", () => {
    const testCase: CaseData = {
      case_id: "TEST-01",
      opening_balance_bdt: "100.00",
      days: [
        { date: "2026-01-01", units: 10 },
        { date: "2026-01-02", units: 10 },
        { date: "2026-01-03", units: 10 },
        { date: "2026-01-04", units: 10 },
        { date: "2026-02-01", units: 10 },
      ],
      recharges: [
        { date: "2026-01-02", amount_bdt: "500.00" }, // 1st recharge in Jan
        { date: "2026-01-03", amount_bdt: "300.00" }, // 2nd recharge in Jan -> NO fixed charge!
        { date: "2026-02-01", amount_bdt: "400.00" }, // 1st recharge in Feb -> fixed charge applies!
      ],
      today: "2026-02-01",
      usual_daily_units: 10,
      target_date: "2026-02-15",
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

    const res = simulateMeter(testCase, testTariff);
    expect(res.ledger.length).toBe(5);

    // Day 1 (Jan 01): No recharge, energy = 10*5 = 50, VAT = 2.50, cost = 52.50, balance = 100 - 52.50 = 47.50
    expect(res.ledger[0].fixed_charges_bdt).toBe(0);
    expect(res.ledger[0].closing_balance_bdt).toBe(47.5);

    // Day 2 (Jan 02): Recharge 500 -> 1st recharge in Jan -> Fixed charges 80 BDT applies!
    // Balance before cost: 47.50 + 500 = 547.50
    // Energy: 10 units (units 11-20 in Slab 1) = 50 BDT. Fixed = 80 BDT. Base = 130. VAT = 6.50. Total cost = 136.50
    // Closing balance: 547.50 - 136.50 = 411.00
    expect(res.ledger[1].is_first_recharge_of_month).toBe(true);
    expect(res.ledger[1].fixed_charges_bdt).toBe(80.0);
    expect(res.ledger[1].total_meter_cost_bdt).toBe(136.5);
    expect(res.ledger[1].closing_balance_bdt).toBe(411.0);

    // Day 3 (Jan 03): 2nd recharge 300 -> NOT first recharge -> Fixed charges = 0!
    expect(res.ledger[2].is_first_recharge_of_month).toBe(false);
    expect(res.ledger[2].fixed_charges_bdt).toBe(0);

    // Day 5 (Feb 01): Month transition to Feb! 1st recharge in Feb -> Fixed charges 80 applies!
    expect(res.ledger[4].is_first_recharge_of_month).toBe(true);
    expect(res.ledger[4].fixed_charges_bdt).toBe(80.0);
    expect(res.ledger[4].monthly_running_units_before).toBe(0);
  });
});

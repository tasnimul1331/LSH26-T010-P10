import { describe, it, expect } from "vitest";
import { loadAllCases } from "@/lib/data/case-loader";
import { loadTariffConfig } from "@/lib/data/tariff-loader";
import { simulateMeter } from "@/lib/engine/meter-engine";
import { calculateDepletionForecast, calculateTargetRecharge } from "@/lib/engine/advisor-engine";
import { compareRechargeStrategies } from "@/lib/engine/comparison-engine";
import { validateCaseIntegrity } from "@/lib/validation/case-schema";

describe("Regression Suite - All 25 Public Cases", () => {
  const { cases } = loadAllCases();
  const tariff = loadTariffConfig();

  it("loads at least 25 public test cases", () => {
    expect(cases.size).toBeGreaterThanOrEqual(25);
  });

  Array.from(cases.values()).forEach((caseData) => {
    describe(`Case ${caseData.case_id}`, () => {
      it("passes strict case schema & integrity validation", () => {
        const report = validateCaseIntegrity(caseData);
        expect(report.is_valid, `Validation failed: ${report.errors.join(", ")}`).toBe(true);
      });

      it("successfully runs chronological meter balance reconstruction", () => {
        const sim = simulateMeter(caseData, tariff);
        expect(sim.ledger.length).toBe(caseData.days.length);
        expect(Number.isFinite(sim.current_balance_bdt)).toBe(true);
      });

      it("successfully computes depletion forecast and target recharge", () => {
        const depletion = calculateDepletionForecast(caseData, tariff);
        expect(depletion.days_remaining).toBeGreaterThanOrEqual(0);

        const target = calculateTargetRecharge(caseData, tariff);
        expect(target.required_recharge_bdt).toBeGreaterThanOrEqual(0);

        // 4-part cost decomposition sum check
        const sum =
          target.breakdown.energy_cost_base_bdt +
          target.breakdown.higher_slab_effect_bdt +
          target.breakdown.fixed_charges_bdt +
          target.breakdown.vat_bdt;
        expect(Math.abs(sum - target.breakdown.total_projected_cost_bdt)).toBeLessThan(0.02);
      });

      it("enforces identical energy cost invariant in 3-month comparison", () => {
        const comp = compareRechargeStrategies(caseData, tariff);
        expect(comp.invariant_check_passed).toBe(true);
        expect(comp.energy_cost_difference_bdt).toBe(0);
      });
    });
  });
});

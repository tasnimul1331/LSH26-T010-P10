import {
  CaseData,
  TariffConfig,
  ComparisonResult,
  StrategyResult,
  StrategySimulationDay,
} from "@/types";
import { Money, roundBDT } from "../utils/money";
import { getMonthKey, isFirstDayOfMonth } from "../utils/dates";
import {
  calculateDailyEnergyCost,
  calculateMonthlyFixedCharges,
  calculateVAT,
} from "./tariff-engine";

/**
 * Runs isolated three-month simulations for the two mandated recharge strategies:
 * Strategy A: Low-Balance Strategy (recharges low_amount_bdt when balance <= low_threshold_bdt)
 * Strategy B: Monthly Strategy (recharges monthly_amount_bdt on the 1st of each month)
 *
 * CRITICAL INVARIANT:
 * Both strategies receive the EXACT SAME daily unit readings and the exact same calendar-month
 * slab counter progression. Recharge timing cannot manufacture an energy-rate saving.
 */
export function compareRechargeStrategies(
  caseData: CaseData,
  tariff: TariffConfig
): ComparisonResult {
  const compConfig = caseData.comparison;
  const targetMonthsSet = new Set(compConfig.months);

  // Filter case days to only include the 3 comparison months
  const comparisonDays = caseData.days.filter((d) =>
    targetMonthsSet.has(getMonthKey(d.date))
  );

  const initialOpeningBalance = Money.fromBDT(compConfig.opening_balance_bdt);
  const lowThreshold = Money.fromBDT(compConfig.low_threshold_bdt);
  const lowRechargeAmount = Money.fromBDT(compConfig.low_amount_bdt);
  const monthlyRechargeAmount = Money.fromBDT(compConfig.monthly_amount_bdt);

  // -------------------------------------------------------------
  // SIMULATION A: Low-Balance Strategy
  // -------------------------------------------------------------
  let balanceA = initialOpeningBalance;
  let runningUnitsA = 0;
  let currentMonthA = "";
  let firstRechargeAppliedA = false;

  let totalRechargeAmountA = Money.zero();
  let totalRechargeCountA = 0;
  let totalEnergyCostA = Money.zero();
  let totalFixedChargesA = Money.zero();
  let totalVATA = Money.zero();
  let totalMeterCostA = Money.zero();
  const timelineA: StrategySimulationDay[] = [];

  for (const day of comparisonDays) {
    const monthKey = getMonthKey(day.date);

    // Calendar month reset
    if (monthKey !== currentMonthA) {
      currentMonthA = monthKey;
      runningUnitsA = 0;
      firstRechargeAppliedA = false;
    }

    // Check low-balance trigger
    let rechargeTodayBDT = 0;
    let rechargeTriggered = false;

    if (balanceA.lessThan(lowThreshold) || balanceA.equals(lowThreshold)) {
      balanceA = balanceA.add(lowRechargeAmount);
      totalRechargeAmountA = totalRechargeAmountA.add(lowRechargeAmount);
      totalRechargeCountA += 1;
      rechargeTodayBDT = lowRechargeAmount.toBDT();
      rechargeTriggered = true;
    }

    // Apply first-recharge fixed charges if a recharge occurred
    let fixedChargesTodayBDT = 0;
    if (rechargeTriggered && !firstRechargeAppliedA) {
      firstRechargeAppliedA = true;
      const fixed = calculateMonthlyFixedCharges(
        tariff,
        tariff.sanctioned_load_kw_default
      );
      fixedChargesTodayBDT = fixed.total_fixed_charges_bdt;
      totalFixedChargesA = totalFixedChargesA.add(Money.fromBDT(fixedChargesTodayBDT));
    }

    // Energy calculation
    const energyCalc = calculateDailyEnergyCost(day.units, runningUnitsA, tariff);
    const energyBDT = energyCalc.energy_cost_bdt;
    totalEnergyCostA = totalEnergyCostA.add(Money.fromBDT(energyBDT));

    // VAT calculation
    const vatBDT = calculateVAT(
      energyBDT,
      fixedChargesTodayBDT,
      tariff.vat_percentage
    );
    totalVATA = totalVATA.add(Money.fromBDT(vatBDT));

    // Total daily cost
    const dayCostMoney = Money.fromBDT(energyBDT)
      .add(Money.fromBDT(fixedChargesTodayBDT))
      .add(Money.fromBDT(vatBDT));
    totalMeterCostA = totalMeterCostA.add(dayCostMoney);

    // Deduct cost from balance
    balanceA = balanceA.subtract(dayCostMoney);
    runningUnitsA = energyCalc.running_units_after;

    timelineA.push({
      date: day.date,
      units: day.units,
      recharge_amount_bdt: rechargeTodayBDT,
      energy_cost_bdt: energyBDT,
      fixed_charges_bdt: fixedChargesTodayBDT,
      vat_bdt: vatBDT,
      total_cost_bdt: dayCostMoney.toBDT(),
      closing_balance_bdt: balanceA.toBDT(),
      monthly_running_units: runningUnitsA,
      recharge_triggered: rechargeTriggered,
    });
  }

  // -------------------------------------------------------------
  // SIMULATION B: Monthly Strategy
  // -------------------------------------------------------------
  let balanceB = initialOpeningBalance;
  let runningUnitsB = 0;
  let currentMonthB = "";
  let firstRechargeAppliedB = false;

  let totalRechargeAmountB = Money.zero();
  let totalRechargeCountB = 0;
  let totalEnergyCostB = Money.zero();
  let totalFixedChargesB = Money.zero();
  let totalVATB = Money.zero();
  let totalMeterCostB = Money.zero();
  const timelineB: StrategySimulationDay[] = [];

  for (const day of comparisonDays) {
    const monthKey = getMonthKey(day.date);
    const isFirstDay = isFirstDayOfMonth(day.date);

    // Calendar month reset
    if (monthKey !== currentMonthB) {
      currentMonthB = monthKey;
      runningUnitsB = 0;
      firstRechargeAppliedB = false;
    }

    // Monthly recharge on 1st day of month
    let rechargeTodayBDT = 0;
    let rechargeTriggered = false;

    if (isFirstDay) {
      balanceB = balanceB.add(monthlyRechargeAmount);
      totalRechargeAmountB = totalRechargeAmountB.add(monthlyRechargeAmount);
      totalRechargeCountB += 1;
      rechargeTodayBDT = monthlyRechargeAmount.toBDT();
      rechargeTriggered = true;
    }

    // Apply first-recharge fixed charges on 1st recharge
    let fixedChargesTodayBDT = 0;
    if (rechargeTriggered && !firstRechargeAppliedB) {
      firstRechargeAppliedB = true;
      const fixed = calculateMonthlyFixedCharges(
        tariff,
        tariff.sanctioned_load_kw_default
      );
      fixedChargesTodayBDT = fixed.total_fixed_charges_bdt;
      totalFixedChargesB = totalFixedChargesB.add(Money.fromBDT(fixedChargesTodayBDT));
    }

    // Energy calculation
    const energyCalc = calculateDailyEnergyCost(day.units, runningUnitsB, tariff);
    const energyBDT = energyCalc.energy_cost_bdt;
    totalEnergyCostB = totalEnergyCostB.add(Money.fromBDT(energyBDT));

    // VAT calculation
    const vatBDT = calculateVAT(
      energyBDT,
      fixedChargesTodayBDT,
      tariff.vat_percentage
    );
    totalVATB = totalVATB.add(Money.fromBDT(vatBDT));

    // Total daily cost
    const dayCostMoney = Money.fromBDT(energyBDT)
      .add(Money.fromBDT(fixedChargesTodayBDT))
      .add(Money.fromBDT(vatBDT));
    totalMeterCostB = totalMeterCostB.add(dayCostMoney);

    // Deduct cost from balance
    balanceB = balanceB.subtract(dayCostMoney);
    runningUnitsB = energyCalc.running_units_after;

    timelineB.push({
      date: day.date,
      units: day.units,
      recharge_amount_bdt: rechargeTodayBDT,
      energy_cost_bdt: energyBDT,
      fixed_charges_bdt: fixedChargesTodayBDT,
      vat_bdt: vatBDT,
      total_cost_bdt: dayCostMoney.toBDT(),
      closing_balance_bdt: balanceB.toBDT(),
      monthly_running_units: runningUnitsB,
      recharge_triggered: rechargeTriggered,
    });
  }

  // -------------------------------------------------------------
  // INVARIANT VERIFICATION & DIFFERENCE
  // -------------------------------------------------------------
  const totalUnits = comparisonDays.reduce((acc, d) => acc + d.units, 0);

  // Energy cost difference MUST BE 0.00
  const energyDiff = totalEnergyCostA.subtract(totalEnergyCostB);
  const invariantCheckPassed = energyDiff.isZero();

  const costDifferenceMoney = totalMeterCostA.subtract(totalMeterCostB);
  const costDiffBDT = costDifferenceMoney.toBDT();

  const fixedDiffBDT = totalFixedChargesA.subtract(totalFixedChargesB).toBDT();
  const vatDiffBDT = totalVATA.subtract(totalVATB).toBDT();

  const isTie = costDifferenceMoney.isZero();
  let cheaperStrategy: "low_balance" | "monthly" | "equal" = "equal";
  let verdictMessage = "Equal cost";

  if (isTie) {
    cheaperStrategy = "equal";
    verdictMessage = "Equal cost (BDT 0.00 difference)";
  } else if (costDiffBDT < 0) {
    cheaperStrategy = "low_balance";
    verdictMessage = `Low-Balance strategy costs BDT ${Math.abs(costDiffBDT).toFixed(2)} less over the 3 months.`;
  } else {
    cheaperStrategy = "monthly";
    verdictMessage = `Monthly strategy costs BDT ${costDiffBDT.toFixed(2)} less over the 3 months.`;
  }

  const resultA: StrategyResult = {
    strategy_id: "low_balance",
    name: "Low-Balance Strategy",
    description: `Recharges BDT ${compConfig.low_amount_bdt} whenever balance drops to/below BDT ${compConfig.low_threshold_bdt}`,
    opening_balance_bdt: initialOpeningBalance.toBDT(),
    closing_balance_bdt: balanceA.toBDT(),
    total_units: totalUnits,
    total_recharges_count: totalRechargeCountA,
    total_recharged_amount_bdt: totalRechargeAmountA.toBDT(),
    total_energy_cost_bdt: totalEnergyCostA.toBDT(),
    total_fixed_charges_bdt: totalFixedChargesA.toBDT(),
    total_vat_bdt: totalVATA.toBDT(),
    total_meter_cost_bdt: totalMeterCostA.toBDT(),
    timeline: timelineA,
  };

  const resultB: StrategyResult = {
    strategy_id: "monthly",
    name: "Monthly Strategy",
    description: `Recharges BDT ${compConfig.monthly_amount_bdt} on the 1st day of each comparison month`,
    opening_balance_bdt: initialOpeningBalance.toBDT(),
    closing_balance_bdt: balanceB.toBDT(),
    total_units: totalUnits,
    total_recharges_count: totalRechargeCountB,
    total_recharged_amount_bdt: totalRechargeAmountB.toBDT(),
    total_energy_cost_bdt: totalEnergyCostB.toBDT(),
    total_fixed_charges_bdt: totalFixedChargesB.toBDT(),
    total_vat_bdt: totalVATB.toBDT(),
    total_meter_cost_bdt: totalMeterCostB.toBDT(),
    timeline: timelineB,
  };

  return {
    case_id: caseData.case_id,
    tariff_version: tariff.tariff_version,
    comparison_months: compConfig.months,
    total_units_consumed: totalUnits,
    low_balance_strategy: resultA,
    monthly_strategy: resultB,
    cost_difference_bdt: costDiffBDT,
    is_tie: isTie,
    cheaper_strategy: cheaperStrategy,
    verdict_message: verdictMessage,
    fixed_charges_difference_bdt: fixedDiffBDT,
    vat_difference_bdt: vatDiffBDT,
    energy_cost_difference_bdt: energyDiff.toBDT(),
    invariant_check_passed: invariantCheckPassed,
    explanation: isTie
      ? `Both strategies consumed the exact same ${totalUnits} units with identical calendar-month slab progression (${totalEnergyCostA.format()} energy cost) and triggered the exact same monthly fixed charges (${totalFixedChargesA.format()}), resulting in an exact mathematical tie.`
      : `Both strategies consumed the exact same ${totalUnits} units (${totalEnergyCostA.format()} energy cost). The cost variance of ${costDifferenceMoney.format()} is strictly due to monthly fixed charge trigger timing (${fixedDiffBDT > 0 ? "+" : ""}${fixedDiffBDT.toFixed(2)} BDT fixed charges, ${vatDiffBDT > 0 ? "+" : ""}${vatDiffBDT.toFixed(2)} BDT VAT). Recharge timing did not alter energy rates.`,
  };
}

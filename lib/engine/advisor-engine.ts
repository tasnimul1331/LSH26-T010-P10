import {
  CaseData,
  TariffConfig,
  DepletionForecast,
  ForecastDayRow,
  TargetRechargeResult,
  CostDecomposition,
} from "@/types";
import { Money, roundBDT } from "../utils/money";
import { getMonthKey, addDays, daysBetween } from "../utils/dates";
import { simulateMeter } from "./meter-engine";
import {
  calculateDailyEnergyCost,
  calculateMonthlyFixedCharges,
  calculateVAT,
} from "./tariff-engine";

/**
 * Predicts the exact future date on which the meter balance will be exhausted,
 * starting from the reconstructed balance as of 'today'.
 */
export function calculateDepletionForecast(
  caseData: CaseData,
  tariff: TariffConfig,
  dailyUnitsOverride?: number,
  maxForecastDays = 180
): DepletionForecast {
  const sim = simulateMeter(caseData, tariff);
  const currentBalance = Money.fromBDT(sim.current_balance_bdt);
  const todayStr = caseData.today;
  const dailyUnits = dailyUnitsOverride ?? caseData.usual_daily_units;

  // Track the month and running units starting from today
  let currentMonthKey = getMonthKey(todayStr);
  const lastLedgerRow = sim.ledger[sim.ledger.length - 1];
  let monthlyRunningUnits = lastLedgerRow ? lastLedgerRow.monthly_running_units_after : 0;

  let balance = currentBalance;
  let depletionDate: string | null = null;
  let daysRemaining = 0;
  let shortfall = 0;

  const dailyForecast: ForecastDayRow[] = [];

  if (balance.toBDT() <= 0) {
    return {
      current_balance_bdt: currentBalance.toBDT(),
      current_date: todayStr,
      usual_daily_units: dailyUnits,
      depletion_date: todayStr,
      days_remaining: 0,
      depletion_day_shortfall_bdt: Math.abs(balance.toBDT()),
      daily_forecast: [],
    };
  }

  for (let dayOffset = 1; dayOffset <= maxForecastDays; dayOffset++) {
    const forecastDate = addDays(todayStr, dayOffset);
    const monthKey = getMonthKey(forecastDate);

    // Month boundary reset
    if (monthKey !== currentMonthKey) {
      currentMonthKey = monthKey;
      monthlyRunningUnits = 0;
    }

    // Energy calculation
    const energyCalc = calculateDailyEnergyCost(
      dailyUnits,
      monthlyRunningUnits,
      tariff
    );
    const energyCostBDT = energyCalc.energy_cost_bdt;

    // In no-recharge future forecast, no new first-recharge fixed charge occurs
    const fixedChargesBDT = 0;

    // VAT on energy
    const vatBDT = calculateVAT(energyCostBDT, fixedChargesBDT, tariff.vat_percentage);

    const dayCostMoney = Money.fromBDT(energyCostBDT).add(Money.fromBDT(vatBDT));
    balance = balance.subtract(dayCostMoney);
    monthlyRunningUnits = energyCalc.running_units_after;

    const isDepleted = balance.isNegative() || balance.isZero();

    dailyForecast.push({
      date: forecastDate,
      units: dailyUnits,
      energy_cost_bdt: energyCostBDT,
      fixed_charges_bdt: fixedChargesBDT,
      vat_bdt: vatBDT,
      total_cost_bdt: dayCostMoney.toBDT(),
      closing_balance_bdt: balance.toBDT(),
      is_depleted: isDepleted,
    });

    if (isDepleted && depletionDate === null) {
      depletionDate = forecastDate;
      daysRemaining = dayOffset;
      shortfall = Math.abs(balance.toBDT());
    }

    // Stop after several days past depletion
    if (depletionDate !== null && dayOffset >= daysRemaining + 7) {
      break;
    }
  }

  return {
    current_balance_bdt: currentBalance.toBDT(),
    current_date: todayStr,
    usual_daily_units: dailyUnits,
    depletion_date: depletionDate,
    days_remaining: depletionDate ? daysRemaining : maxForecastDays,
    depletion_day_shortfall_bdt: shortfall,
    daily_forecast: dailyForecast,
  };
}

/**
 * Calculates the exact recharge amount required today to keep the meter funded
 * through the target date, and provides a 4-part transparent cost decomposition:
 * 1. Base Energy Cost
 * 2. Higher-Slab Effect
 * 3. Fixed Charges
 * 4. VAT
 */
export function calculateTargetRecharge(
  caseData: CaseData,
  tariff: TariffConfig,
  targetDateOverride?: string,
  dailyUnitsOverride?: number
): TargetRechargeResult {
  const sim = simulateMeter(caseData, tariff);
  const currentBalance = Money.fromBDT(sim.current_balance_bdt);
  const todayStr = caseData.today;
  const targetDateStr = targetDateOverride || caseData.target_date;
  const dailyUnits = dailyUnitsOverride ?? caseData.usual_daily_units;

  const daysAhead = Math.max(0, daysBetween(todayStr, targetDateStr));

  let currentMonthKey = getMonthKey(todayStr);
  const lastLedgerRow = sim.ledger[sim.ledger.length - 1];
  let monthlyRunningUnits = lastLedgerRow ? lastLedgerRow.monthly_running_units_after : 0;

  let totalProjectedUnits = 0;
  let totalEnergyMoney = Money.zero();
  let totalFixedMoney = Money.zero();
  let totalVATMoney = Money.zero();

  // Track months entered in the target window to apply monthly fixed charges
  const monthsSeenInForecast = new Set<string>();

  for (let dayOffset = 1; dayOffset <= daysAhead; dayOffset++) {
    const forecastDate = addDays(todayStr, dayOffset);
    const monthKey = getMonthKey(forecastDate);

    let isNewMonthFirstDayInWindow = false;

    // Month boundary reset
    if (monthKey !== currentMonthKey) {
      currentMonthKey = monthKey;
      monthlyRunningUnits = 0;
      if (!monthsSeenInForecast.has(monthKey)) {
        monthsSeenInForecast.add(monthKey);
        isNewMonthFirstDayInWindow = true;
      }
    }

    // Fixed charges incurred for funding future months
    let dayFixedBDT = 0;
    if (isNewMonthFirstDayInWindow) {
      const fixed = calculateMonthlyFixedCharges(
        tariff,
        tariff.sanctioned_load_kw_default
      );
      dayFixedBDT = fixed.total_fixed_charges_bdt;
      totalFixedMoney = totalFixedMoney.add(Money.fromBDT(dayFixedBDT));
    }

    // Energy calculation
    const energyCalc = calculateDailyEnergyCost(
      dailyUnits,
      monthlyRunningUnits,
      tariff
    );
    totalProjectedUnits += dailyUnits;
    const dayEnergyMoney = Money.fromBDT(energyCalc.energy_cost_bdt);
    totalEnergyMoney = totalEnergyMoney.add(dayEnergyMoney);

    // VAT calculation
    const dayVATBDT = calculateVAT(
      energyCalc.energy_cost_bdt,
      dayFixedBDT,
      tariff.vat_percentage
    );
    totalVATMoney = totalVATMoney.add(Money.fromBDT(dayVATBDT));

    monthlyRunningUnits = energyCalc.running_units_after;
  }

  // Total projected future cost
  const totalProjectedCostMoney = totalEnergyMoney
    .add(totalFixedMoney)
    .add(totalVATMoney);

  // Required recharge is max(0, Projected Cost - Current Balance)
  const shortfallMoney = totalProjectedCostMoney.subtract(currentBalance);
  const requiredRechargeMoney = shortfallMoney.clampMinZero();

  // 4-Part Cost Decomposition
  // 1. Base Energy Cost: total units * base slab rate
  const baseRate = tariff.base_slab_rate_for_breakdown;
  const baseEnergyCostMoney = Money.fromBDT(roundBDT(totalProjectedUnits * baseRate));

  // 2. Higher Slab Effect: Energy Cost - Base Energy Cost
  const higherSlabEffectMoney = totalEnergyMoney
    .subtract(baseEnergyCostMoney)
    .clampMinZero();

  // 3. Fixed Charges
  const fixedChargesMoney = totalFixedMoney;

  // 4. VAT
  const vatMoney = totalVATMoney;

  // Proof note & mathematical reconciliation
  const breakdown: CostDecomposition = {
    energy_cost_base_bdt: baseEnergyCostMoney.toBDT(),
    higher_slab_effect_bdt: higherSlabEffectMoney.toBDT(),
    fixed_charges_bdt: fixedChargesMoney.toBDT(),
    vat_bdt: vatMoney.toBDT(),
    total_projected_cost_bdt: totalProjectedCostMoney.toBDT(),
    base_rate: baseRate,
    total_units: totalProjectedUnits,
    formula_notes: [
      `Base Energy Cost = ${totalProjectedUnits} units × BDT ${baseRate.toFixed(2)}/unit = ${baseEnergyCostMoney.format()}`,
      `Higher-Slab Effect = Total Energy (${totalEnergyMoney.format()}) - Base Energy (${baseEnergyCostMoney.format()}) = ${higherSlabEffectMoney.format()}`,
      `Fixed Charges = Demand Charge + Meter Rent for future months = ${fixedChargesMoney.format()}`,
      `VAT (${tariff.vat_percentage}%) = 5% of (Energy + Fixed Charges) = ${vatMoney.format()}`,
      `Total Projected Cost = ${baseEnergyCostMoney.format()} + ${higherSlabEffectMoney.format()} + ${fixedChargesMoney.format()} + ${vatMoney.format()} = ${totalProjectedCostMoney.format()}`,
    ],
  };

  return {
    case_id: caseData.case_id,
    current_date: todayStr,
    target_date: targetDateStr,
    days_ahead: daysAhead,
    usual_daily_units: dailyUnits,
    current_balance_bdt: currentBalance.toBDT(),
    projected_total_cost_bdt: totalProjectedCostMoney.toBDT(),
    required_recharge_bdt: requiredRechargeMoney.toBDT(),
    breakdown,
    assumptions: {
      tariff_version: tariff.tariff_version,
      no_interim_recharges_assumed: true,
      constant_daily_usage: dailyUnits,
      sanctioned_load_kw: tariff.sanctioned_load_kw_default,
    },
  };
}

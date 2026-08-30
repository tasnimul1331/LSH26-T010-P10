import { CaseData, TariffConfig, DailyLedgerRow, SimulationResult, MonthlySummary } from "@/types";
import { Money, roundBDT } from "../utils/money";
import { getMonthKey } from "../utils/dates";
import {
  calculateDailyEnergyCost,
  calculateMonthlyFixedCharges,
  calculateVAT,
} from "./tariff-engine";

/**
 * Reconstructs the complete day-by-day prepaid electricity meter simulation
 * for a given case and tariff specification.
 */
export function simulateMeter(caseData: CaseData, tariff: TariffConfig): SimulationResult {
  let currentBalance = Money.fromBDT(caseData.opening_balance_bdt);
  let cumulativeEnergy = Money.zero();
  let cumulativeFixed = Money.zero();
  let cumulativeVAT = Money.zero();
  let cumulativeTotalCost = Money.zero();
  let cumulativeRecharge = Money.zero();

  let currentMonthKey = "";
  let monthlyRunningUnits = 0;
  let firstRechargeAppliedThisMonth = false;

  // Index recharges by date (a date might have multiple recharges)
  const rechargesByDate = new Map<string, Money>();
  for (const r of caseData.recharges) {
    const existing = rechargesByDate.get(r.date) || Money.zero();
    rechargesByDate.set(r.date, existing.add(Money.fromBDT(r.amount_bdt)));
  }

  const ledger: DailyLedgerRow[] = [];
  const monthlySummaryMap = new Map<string, {
    totalUnits: number;
    rechargeCount: number;
    rechargeTotal: Money;
    energyTotal: Money;
    fixedTotal: Money;
    vatTotal: Money;
    costTotal: Money;
    closingBalance: number;
  }>();

  for (let i = 0; i < caseData.days.length; i++) {
    const reading = caseData.days[i];
    const dateStr = reading.date;
    const monthKey = getMonthKey(dateStr);
    const dayOfMonth = parseInt(dateStr.substring(8, 10), 10);

    // Step 1: Detect calendar-month transition
    if (monthKey !== currentMonthKey) {
      currentMonthKey = monthKey;
      monthlyRunningUnits = 0;
      firstRechargeAppliedThisMonth = false;
    }

    const openingBalanceForDay = currentBalance.toBDT();

    // Step 2: Apply recharges on this date
    const rechargeMoney = rechargesByDate.get(dateStr) || Money.zero();
    const hasRechargeToday = !rechargeMoney.isZero();
    if (hasRechargeToday) {
      currentBalance = currentBalance.add(rechargeMoney);
      cumulativeRecharge = cumulativeRecharge.add(rechargeMoney);
    }

    // Step 3: Check and apply first-recharge monthly fixed charges
    let demandChargeBDT = 0;
    let meterRentBDT = 0;
    let fixedChargesTodayBDT = 0;
    let isFirstRecharge = false;

    if (hasRechargeToday && !firstRechargeAppliedThisMonth) {
      firstRechargeAppliedThisMonth = true;
      isFirstRecharge = true;
      const fixed = calculateMonthlyFixedCharges(
        tariff,
        tariff.sanctioned_load_kw_default
      );
      demandChargeBDT = fixed.demand_charge_bdt;
      meterRentBDT = fixed.meter_rent_bdt;
      fixedChargesTodayBDT = fixed.total_fixed_charges_bdt;
    }

    // Step 4: Calculate daily energy cost across slabs
    const energyCalc = calculateDailyEnergyCost(
      reading.units,
      monthlyRunningUnits,
      tariff
    );
    const energyCostTodayBDT = energyCalc.energy_cost_bdt;

    // Step 5: Calculate VAT on (energy cost + today's fixed charges)
    const vatTodayBDT = calculateVAT(
      energyCostTodayBDT,
      fixedChargesTodayBDT,
      tariff.vat_percentage
    );

    // Step 6: Total daily meter-consumed cost
    const fixedMoney = Money.fromBDT(fixedChargesTodayBDT);
    const energyMoney = Money.fromBDT(energyCostTodayBDT);
    const vatMoney = Money.fromBDT(vatTodayBDT);
    const totalDailyCostMoney = energyMoney.add(fixedMoney).add(vatMoney);

    // Step 7: Deduct meter-consumed cost from balance
    currentBalance = currentBalance.subtract(totalDailyCostMoney);

    // Step 8: Advance monthly running units
    monthlyRunningUnits = energyCalc.running_units_after;

    // Update cumulative trackers
    cumulativeEnergy = cumulativeEnergy.add(energyMoney);
    cumulativeFixed = cumulativeFixed.add(fixedMoney);
    cumulativeVAT = cumulativeVAT.add(vatMoney);
    cumulativeTotalCost = cumulativeTotalCost.add(totalDailyCostMoney);

    // Record ledger row
    const row: DailyLedgerRow = {
      date: dateStr,
      units: reading.units,
      month: monthKey,
      day_of_month: dayOfMonth,
      monthly_running_units_before: energyCalc.running_units_before,
      monthly_running_units_after: energyCalc.running_units_after,
      slab_slices: energyCalc.slab_slices,
      energy_cost_bdt: energyCostTodayBDT,
      recharge_amount_bdt: rechargeMoney.toBDT(),
      is_first_recharge_of_month: isFirstRecharge,
      demand_charge_bdt: demandChargeBDT,
      meter_rent_bdt: meterRentBDT,
      fixed_charges_bdt: fixedChargesTodayBDT,
      vat_bdt: vatTodayBDT,
      total_meter_cost_bdt: totalDailyCostMoney.toBDT(),
      opening_balance_bdt: openingBalanceForDay,
      closing_balance_bdt: currentBalance.toBDT(),
      cumulative_energy_cost_bdt: cumulativeEnergy.toBDT(),
      cumulative_fixed_charge_bdt: cumulativeFixed.toBDT(),
      cumulative_vat_bdt: cumulativeVAT.toBDT(),
      cumulative_total_cost_bdt: cumulativeTotalCost.toBDT(),
      cumulative_recharge_bdt: cumulativeRecharge.toBDT(),
    };

    ledger.push(row);

    // Update monthly summary
    let mSummary = monthlySummaryMap.get(monthKey);
    if (!mSummary) {
      mSummary = {
        totalUnits: 0,
        rechargeCount: 0,
        rechargeTotal: Money.zero(),
        energyTotal: Money.zero(),
        fixedTotal: Money.zero(),
        vatTotal: Money.zero(),
        costTotal: Money.zero(),
        closingBalance: 0,
      };
      monthlySummaryMap.set(monthKey, mSummary);
    }
    mSummary.totalUnits += reading.units;
    if (hasRechargeToday) {
      mSummary.rechargeCount += 1;
      mSummary.rechargeTotal = mSummary.rechargeTotal.add(rechargeMoney);
    }
    mSummary.energyTotal = mSummary.energyTotal.add(energyMoney);
    mSummary.fixedTotal = mSummary.fixedTotal.add(fixedMoney);
    mSummary.vatTotal = mSummary.vatTotal.add(vatMoney);
    mSummary.costTotal = mSummary.costTotal.add(totalDailyCostMoney);
    mSummary.closingBalance = currentBalance.toBDT();
  }

  const monthlySummaries: MonthlySummary[] = Array.from(monthlySummaryMap.entries()).map(
    ([month, s]) => ({
      month,
      total_units: s.totalUnits,
      recharge_count: s.rechargeCount,
      total_recharges_bdt: s.rechargeTotal.toBDT(),
      energy_cost_bdt: s.energyTotal.toBDT(),
      fixed_charges_bdt: s.fixedTotal.toBDT(),
      vat_bdt: s.vatTotal.toBDT(),
      total_cost_bdt: s.costTotal.toBDT(),
      closing_balance_bdt: s.closingBalance,
    })
  );

  const totalUnitsAll = caseData.days.reduce((acc, d) => acc + d.units, 0);

  return {
    case_id: caseData.case_id,
    tariff_version: tariff.tariff_version,
    opening_balance_bdt: Money.fromBDT(caseData.opening_balance_bdt).toBDT(),
    current_balance_bdt: currentBalance.toBDT(),
    today: caseData.today,
    total_days: caseData.days.length,
    total_units: totalUnitsAll,
    total_recharges_bdt: cumulativeRecharge.toBDT(),
    total_energy_cost_bdt: cumulativeEnergy.toBDT(),
    total_fixed_charges_bdt: cumulativeFixed.toBDT(),
    total_vat_bdt: cumulativeVAT.toBDT(),
    total_meter_cost_bdt: cumulativeTotalCost.toBDT(),
    ledger,
    monthly_summaries: monthlySummaries,
  };
}

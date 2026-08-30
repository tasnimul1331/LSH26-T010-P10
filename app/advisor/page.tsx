"use client";

import React, { useState } from "react";
import { useCase } from "@/components/context/CaseContext";
import { DepletionForecastChart } from "@/components/charts/DepletionForecastChart";
import { CostBreakdownWaterfall } from "@/components/charts/CostBreakdownWaterfall";
import { formatBDT } from "@/lib/utils/money";
import { formatDisplayDate } from "@/lib/utils/dates";
import {
  Calendar,
  Sliders,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Zap,
  RotateCcw,
  AlertCircle,
} from "lucide-react";

export default function AdvisorPage() {
  const {
    caseData,
    simulation,
    depletion,
    targetRecharge,
    updateTargetScenario,
  } = useCase();

  const [selectedDate, setSelectedDate] = useState<string>(
    caseData?.target_date || ""
  );
  const [dailyUnits, setDailyUnits] = useState<number>(
    caseData?.usual_daily_units || 10
  );

  if (!caseData || !simulation || !depletion || !targetRecharge) return null;

  const handleApplyScenario = (e: React.FormEvent) => {
    e.preventDefault();
    updateTargetScenario(selectedDate, dailyUnits);
  };

  const handleResetDefaults = () => {
    setSelectedDate(caseData.target_date);
    setDailyUnits(caseData.usual_daily_units);
    updateTargetScenario(caseData.target_date, caseData.usual_daily_units);
  };

  const isZeroRecharge = targetRecharge.required_recharge_bdt <= 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">
              Recharge Advisor & Target Planner
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#C5A059]/15 text-[#8A6A24] border border-[#C5A059]/30">
              Forecast & Planner
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Answers exactly when balance exhausts and how much to recharge today with 4-part transparent cost decomposition
          </p>
        </div>

        <button
          onClick={handleResetDefaults}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 text-xs font-semibold text-stone-600 shadow-2xs transition-all self-start md:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Case Defaults</span>
        </button>
      </div>

      {/* Target Planning Controls Box */}
      <div className="luxury-card p-6 border-[#C5A059]/40 bg-gradient-to-br from-white via-white to-[#FAF6E9]/40">
        <div className="flex items-center gap-2 mb-4">
          <Sliders className="w-4 h-4 text-[#8A6A24]" />
          <h3 className="text-sm font-bold text-stone-900">Interactive Target Planning Scenario</h3>
        </div>

        <form onSubmit={handleApplyScenario} className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
          {/* Target Date Picker */}
          <div className="sm:col-span-4">
            <label className="text-xs font-semibold text-stone-700 block mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-stone-400" />
              <span>Target Survival Date</span>
            </label>
            <input
              type="date"
              value={selectedDate}
              min={caseData.today}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                updateTargetScenario(e.target.value, dailyUnits);
              }}
              className="w-full px-3.5 py-2 bg-white border border-stone-200 rounded-xl text-xs font-mono font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#C5A059]/50 shadow-2xs"
            />
          </div>

          {/* Daily Units Slider */}
          <div className="sm:col-span-5">
            <div className="flex justify-between items-center mb-1.5 text-xs">
              <label className="font-semibold text-stone-700 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-stone-400" />
                <span>Daily Consumption Rate</span>
              </label>
              <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                {dailyUnits} kWh/day
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={60}
              value={dailyUnits}
              onChange={(e) => {
                const val = Number(e.target.value);
                setDailyUnits(val);
                updateTargetScenario(selectedDate, val);
              }}
              className="w-full accent-[#C5A059] cursor-pointer"
            />
          </div>

          {/* Primary Action Button */}
          <div className="sm:col-span-3">
            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-[#C5A059] text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>Calculate Recharge</span>
            </button>
          </div>
        </form>

        {selectedDate && selectedDate <= caseData.today && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>
              Target date ({selectedDate}) is today or in the past. Please select a future date after <strong>{formatDisplayDate(caseData.today)}</strong> for forward recharge planning.
            </span>
          </div>
        )}
      </div>

      {/* Target Recharge Result Highlight Card */}
      <div className="luxury-card luxury-card-gold p-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-7 space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#8A6A24]">
              TARGET RECHARGE RECOMMENDATION
            </div>
            <div className="text-4xl font-extrabold font-mono text-stone-900 tracking-tight flex items-baseline gap-2">
              <span>{formatBDT(targetRecharge.required_recharge_bdt)}</span>
              {isZeroRecharge && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-full">
                  Fully Funded
                </span>
              )}
            </div>
            <p className="text-xs text-stone-600">
              {isZeroRecharge
                ? `Current balance of ${formatBDT(targetRecharge.current_balance_bdt)} is sufficient to survive through ${formatDisplayDate(targetRecharge.target_date)}.`
                : `Deposit ${formatBDT(targetRecharge.required_recharge_bdt)} today to survive through ${formatDisplayDate(targetRecharge.target_date)} (${targetRecharge.days_ahead} days ahead).`}
            </p>
          </div>

          <div className="md:col-span-5 grid grid-cols-2 gap-3 text-xs font-tabular">
            <div className="p-3 bg-white/80 rounded-xl border border-stone-200/80">
              <span className="text-stone-400 text-[10px] uppercase font-semibold block">
                Projected Cost
              </span>
              <span className="text-base font-extrabold font-mono text-stone-800">
                {formatBDT(targetRecharge.projected_total_cost_bdt)}
              </span>
            </div>
            <div className="p-3 bg-white/80 rounded-xl border border-stone-200/80">
              <span className="text-stone-400 text-[10px] uppercase font-semibold block">
                Available Balance
              </span>
              <span className="text-base font-extrabold font-mono text-stone-800">
                {formatBDT(targetRecharge.current_balance_bdt)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4-Part Transparent Cost Decomposition */}
      <CostBreakdownWaterfall
        breakdown={targetRecharge.breakdown}
        currentBalanceBDT={targetRecharge.current_balance_bdt}
        requiredRechargeBDT={targetRecharge.required_recharge_bdt}
        targetDate={formatDisplayDate(targetRecharge.target_date)}
      />

      {/* Depletion Runway Forecast Chart */}
      <DepletionForecastChart
        forecast={depletion}
        historicalTail={simulation.ledger}
      />

      {/* Mathematical Calculation Notes */}
      <div className="luxury-card p-6 space-y-3">
        <h4 className="font-bold text-stone-900 text-sm flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#8A6A24]" />
          <span>Advisor Calculation Principles & Transparency Notes</span>
        </h4>
        <div className="space-y-1.5 text-xs text-stone-600">
          {targetRecharge.breakdown.formula_notes.map((note, idx) => (
            <div key={idx} className="flex items-start gap-2 font-mono text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>{note}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

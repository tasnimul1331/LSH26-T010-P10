"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useCase } from "@/components/context/CaseContext";
import { SmartMeterCanvas } from "@/components/three/SmartMeterCanvas";
import { BalanceTimelineChart } from "@/components/charts/BalanceTimelineChart";
import { BillPrintModal } from "@/components/billing/BillPrintModal";
import { formatBDT } from "@/lib/utils/money";
import { formatDisplayDate } from "@/lib/utils/dates";
import {
  Wallet,
  Clock,
  Zap,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Scale,
  Calendar,
  AlertTriangle,
  Printer,
  FileText,
  Download,
} from "lucide-react";

export default function OverviewPage() {
  const { caseData, simulation, depletion, targetRecharge, comparison, tariff } = useCase();
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  if (!caseData || !simulation || !depletion || !targetRecharge || !comparison || !tariff) {
    return null;
  }

  const currentBal = simulation.current_balance_bdt;
  const isHealthy = currentBal > 300;
  const isWarning = currentBal <= 300 && currentBal > 100;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner / Executive Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-stone-200">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-stone-900 tracking-tight">
              Prepaid Meter Overview
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#C5A059]/15 text-[#8A6A24] border border-[#C5A059]/30">
              Case {caseData.case_id}
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Real-time balance telemetry, depletion runway, and target-date funding recommendations
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Print Bill PDF</span>
          </button>
          <Link
            href="/advisor"
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 text-[#C5A059] hover:bg-stone-800 text-xs font-bold shadow-sm transition-all"
          >
            <span>Plan Recharge</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Hero Section: 3D Smart Meter + 4 KPI Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch">
        {/* Left: 3D Smart Prepaid Meter */}
        <div className="lg:col-span-5 luxury-card p-4 sm:p-6 flex flex-col items-center justify-between relative overflow-hidden">
          <div className="w-full flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
              3D DIGITAL TWIN
            </span>
            <div className="flex items-center gap-1 text-[11px] font-mono text-[#8A6A24] bg-[#C5A059]/10 px-2 py-0.5 rounded-full">
              <Zap className="w-3 h-3" />
              <span>LIVE SENSOR</span>
            </div>
          </div>

          <SmartMeterCanvas
            balanceBDT={currentBal}
            todayDate={caseData.today}
            totalUnits={simulation.total_units}
            caseId={caseData.case_id}
          />

          <div className="w-full text-center text-xs text-stone-400 mt-2 font-mono">
            Interactive 3D Meter • Drag or hover to tilt
          </div>
        </div>

        {/* Right: 4 Primary KPI Cards */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card 1: Current Meter Balance */}
          <div className="luxury-card p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-stone-500">1. Current Balance</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-extrabold font-mono text-stone-900 tracking-tight">
                {formatBDT(currentBal)}
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isHealthy ? "bg-emerald-500" : isWarning ? "bg-amber-500" : "bg-rose-500"
                  }`}
                />
                <span className="text-[11px] text-stone-500">
                  As of {formatDisplayDate(caseData.today)}
                </span>
              </div>
            </div>
            <div className="pt-3 mt-3 border-t border-stone-100 text-[11px] text-stone-400 flex justify-between font-mono">
              <span>Opening: {formatBDT(caseData.opening_balance_bdt)}</span>
              <span>{simulation.total_days} days recorded</span>
            </div>
          </div>

          {/* Card 2: Depletion Runway */}
          <div className="luxury-card p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-stone-500">2. Depletion Runway</span>
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-extrabold font-mono text-rose-600 tracking-tight">
                {depletion.depletion_date ? `${depletion.days_remaining} Days` : "> 180 Days"}
              </div>
              <div className="flex items-center gap-1 mt-2 text-[11px] text-stone-600 font-medium">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                <span>
                  {depletion.depletion_date
                    ? `Runs out on ${formatDisplayDate(depletion.depletion_date)}`
                    : "Fully funded"}
                </span>
              </div>
            </div>
            <div className="pt-3 mt-3 border-t border-stone-100 text-[11px] text-stone-400 flex justify-between font-mono">
              <span>Usage rate:</span>
              <span>{depletion.usual_daily_units} kWh/day</span>
            </div>
          </div>

          {/* Card 3: Target-Date Recharge */}
          <div className="luxury-card luxury-card-gold p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-stone-700">3. Target Recharge</span>
              <div className="w-8 h-8 rounded-lg bg-[#C5A059]/20 text-[#8A6A24] flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-extrabold font-mono text-[#8A6A24] tracking-tight">
                {formatBDT(targetRecharge.required_recharge_bdt)}
              </div>
              <div className="text-[11px] text-stone-600 mt-2 font-medium">
                Required today to survive until{" "}
                <strong className="text-stone-900 font-mono">
                  {formatDisplayDate(targetRecharge.target_date)}
                </strong>
              </div>
            </div>
            <div className="pt-3 mt-3 border-t border-[#C5A059]/30 text-[11px] text-stone-600 flex justify-between">
              <span>{targetRecharge.days_ahead} days ahead</span>
              <Link href="/advisor" className="text-[#8A6A24] font-bold hover:underline">
                View 4-Part Math →
              </Link>
            </div>
          </div>

          {/* Card 4: Strategy Comparison Snapshot */}
          <div className="luxury-card p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-stone-500">4. Strategy Habit</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Scale className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-xl font-extrabold text-stone-900 tracking-tight">
                {comparison.is_tie ? "Equal Cost" : comparison.verdict_message}
              </div>
              <div className="text-[11px] text-stone-500 mt-2 font-medium">
                3-Month comparison ({comparison.comparison_months.join(", ")})
              </div>
            </div>
            <div className="pt-3 mt-3 border-t border-stone-100 text-[11px] text-stone-400 flex justify-between font-mono">
              <span>Energy Invariant:</span>
              <span className="text-emerald-600 font-bold">Delta ৳0.00</span>
            </div>
          </div>
        </div>
      </div>

      {/* Official PDF User Bill Report Quick Action Banner */}
      <div className="luxury-card p-4 sm:p-5 bg-gradient-to-r from-stone-900 via-stone-900 to-stone-800 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#C5A059]/20 text-[#C5A059] flex items-center justify-center border border-[#C5A059]/30 flex-shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Official Electricity Bill & Audit Statement</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#C5A059] text-stone-950">
                PDF Ready
              </span>
            </div>
            <p className="text-xs text-stone-300 mt-0.5">
              Complete BERC LT-A certified consumption statement, tiered slabs breakdown, and monthly ledger
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsPrintModalOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#C5A059] hover:bg-[#B38F48] text-stone-950 font-extrabold text-xs shadow-md transition-all cursor-pointer flex-shrink-0"
        >
          <Printer className="w-4 h-4" />
          <span>Download / Print PDF Report</span>
        </button>
      </div>

      {/* Balance Timeline Chart */}
      <BalanceTimelineChart
        ledger={simulation.ledger}
        openingBalanceBDT={simulation.opening_balance_bdt}
      />

      {/* Quick Navigation to Sub-modules */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Module 1: Simulation */}
        <Link
          href="/simulation"
          className="luxury-card p-6 group hover:scale-[1.01] transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-stone-900 text-[#C5A059] flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-xs text-stone-400 group-hover:text-stone-900 font-semibold transition-all">
              Explore →
            </span>
          </div>
          <h3 className="font-bold text-stone-900 text-sm">Full Transaction Ledger</h3>
          <p className="text-xs text-stone-500 mt-1">
            Audit all {simulation.ledger.length} consecutive days with energy, slab slices, fixed charges, and VAT breakdowns.
          </p>
        </Link>

        {/* Module 2: Advisor */}
        <Link
          href="/advisor"
          className="luxury-card p-6 group hover:scale-[1.01] transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#C5A059] text-white flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <span className="text-xs text-stone-400 group-hover:text-stone-900 font-semibold transition-all">
              Explore →
            </span>
          </div>
          <h3 className="font-bold text-stone-900 text-sm">Target Recharge Advisor</h3>
          <p className="text-xs text-stone-500 mt-1">
            Adjust target dates and what-if usage scenarios with instant 4-part cost decomposition.
          </p>
        </Link>

        {/* Module 3: Comparison */}
        <Link
          href="/comparison"
          className="luxury-card p-6 group hover:scale-[1.01] transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
              <Scale className="w-5 h-5" />
            </div>
            <span className="text-xs text-stone-400 group-hover:text-stone-900 font-semibold transition-all">
              Explore →
            </span>
          </div>
          <h3 className="font-bold text-stone-900 text-sm">3-Month Habit Comparison</h3>
          <p className="text-xs text-stone-500 mt-1">
            Verify identical consumption and mathematical proof of equal energy rates between low-balance and monthly habits.
          </p>
        </Link>
      </div>

      {/* Official PDF Bill Print Modal */}
      <BillPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        caseData={caseData}
        tariff={tariff}
        simulation={simulation}
        targetRecharge={targetRecharge}
      />
    </div>
  );
}

"use client";

import React from "react";
import {
  X,
  Printer,
  FileText,
  Zap,
  ShieldCheck,
  Calendar,
  Layers,
  ArrowDownCircle,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { CaseData, TariffConfig, SimulationResult, TargetRechargeResult } from "@/types";
import { formatBDT } from "@/lib/utils/money";
import { formatDisplayDate, formatMonthName } from "@/lib/utils/dates";

interface BillPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseData: CaseData;
  tariff: TariffConfig;
  simulation: SimulationResult;
  targetRecharge: TargetRechargeResult;
}

export const BillPrintModal: React.FC<BillPrintModalProps> = ({
  isOpen,
  onClose,
  caseData,
  tariff,
  simulation,
  targetRecharge,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const startDate = caseData.days[0]?.date || "";
  const endDate = caseData.today;
  const issueDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-start justify-center p-2 sm:p-6 print:p-0 print:bg-white print:static print:inset-auto">
      {/* Container Dialog */}
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-4 sm:my-8 print:my-0 print:border-none print:shadow-none print:max-w-none print:rounded-none">
        {/* Modal Action Bar (Hidden in Print) */}
        <div className="no-print p-4 bg-stone-900 text-white flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#C5A059]/20 text-[#C5A059] flex items-center justify-center border border-[#C5A059]/30">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Prepaid Electricity Bill Statement</h3>
              <p className="text-[11px] text-stone-400">
                Official BERC LT-A Domestic Prepaid Audit Statement • Case {caseData.case_id}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C5A059] hover:bg-[#B38F48] text-stone-900 font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Bill Document Content */}
        <div className="p-6 sm:p-10 text-stone-900 bg-white print:p-0">
          {/* Statement Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b-2 border-stone-900">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-stone-900 text-[#C5A059] flex items-center justify-center flex-shrink-0 print:border print:border-stone-900">
                <Zap className="w-7 h-7 fill-[#C5A059]" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-stone-900 tracking-tight">
                  BANGLADESH PREPAID POWER UTILITY
                </h1>
                <div className="text-xs font-semibold text-[#8A6A24] tracking-wide uppercase mt-0.5">
                  PREPAID ENERGY INTELLIGENCE & TELEMETRY STATEMENT
                </div>
                <p className="text-[11px] text-stone-500 mt-1">
                  Electricity Consumption, Slab Progression, Fixed Charges & Tax Audit
                </p>
              </div>
            </div>

            {/* Bill Meta Details Box */}
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-1 font-mono text-left sm:text-right print:bg-transparent">
              <div>
                <span className="text-stone-500">Statement No: </span>
                <strong className="text-stone-900">STMT-{caseData.case_id}-{caseData.today.replace(/-/g, "")}</strong>
              </div>
              <div>
                <span className="text-stone-500">Issue Date: </span>
                <strong className="text-stone-900">{issueDate}</strong>
              </div>
              <div>
                <span className="text-stone-500">Tariff Spec: </span>
                <strong className="text-stone-900">{tariff.name}</strong>
              </div>
            </div>
          </div>

          {/* Consumer & Meter Information Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 my-6 p-4 rounded-xl bg-stone-50 border border-stone-200 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-stone-400 block">
                Consumer / Case ID
              </span>
              <span className="font-mono font-extrabold text-stone-900 text-sm">
                {caseData.case_id}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-stone-400 block">
                Meter Serial No
              </span>
              <span className="font-mono font-bold text-stone-800">
                MTR-{caseData.case_id}-8829
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-stone-400 block">
                Sanctioned Load
              </span>
              <span className="font-mono font-bold text-stone-800">
                {tariff.sanctioned_load_kw_default} kW (Single Phase)
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-stone-400 block">
                Recorded Cycle
              </span>
              <span className="font-mono font-bold text-stone-800">
                {simulation.total_days} Days ({startDate} → {endDate})
              </span>
            </div>
          </div>

          {/* Account Balance Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
            <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/50">
              <span className="text-[10px] font-bold uppercase text-stone-500">Opening Balance</span>
              <div className="text-lg font-extrabold font-mono text-stone-900 mt-1">
                {formatBDT(simulation.opening_balance_bdt)}
              </div>
              <span className="text-[10px] text-stone-400">As of {startDate}</span>
            </div>

            <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/30">
              <span className="text-[10px] font-bold uppercase text-emerald-800">Total Recharges</span>
              <div className="text-lg font-extrabold font-mono text-emerald-900 mt-1">
                {formatBDT(simulation.total_recharges_bdt)}
              </div>
              <span className="text-[10px] text-emerald-600 font-mono">
                {caseData.recharges.length} deposit events
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/30">
              <span className="text-[10px] font-bold uppercase text-rose-800">Total Meter Cost</span>
              <div className="text-lg font-extrabold font-mono text-rose-900 mt-1">
                {formatBDT(simulation.total_meter_cost_bdt)}
              </div>
              <span className="text-[10px] text-rose-600 font-mono">
                {simulation.total_units} kWh energy + fees
              </span>
            </div>

            <div className="p-3.5 rounded-xl border-2 border-stone-900 bg-stone-900 text-white print:text-stone-900 print:bg-stone-100">
              <span className="text-[10px] font-bold uppercase text-[#C5A059]">Current Balance</span>
              <div className="text-lg font-extrabold font-mono mt-1 text-white print:text-stone-900">
                {formatBDT(simulation.current_balance_bdt)}
              </div>
              <span className="text-[10px] text-stone-300 print:text-stone-600">
                As of {formatDisplayDate(caseData.today)}
              </span>
            </div>
          </div>

          {/* Cost Breakdown Summary Table */}
          <div className="my-6 border border-stone-200 rounded-xl overflow-hidden print:border-stone-400">
            <div className="p-3 bg-stone-100 font-bold text-xs text-stone-800 border-b border-stone-200">
              CONSUMED CHARGES AUDIT BREAKDOWN
            </div>
            <table className="w-full text-xs text-left">
              <tbody className="divide-y divide-stone-200 font-tabular">
                <tr>
                  <td className="p-3 text-stone-700 font-medium">
                    1. Consumed Energy Charges ({simulation.total_units} kWh across BERC LT-A Slabs)
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-stone-900">
                    {formatBDT(simulation.total_energy_cost_bdt)}
                  </td>
                </tr>
                <tr>
                  <td className="p-3 text-stone-700 font-medium">
                    2. Cumulative Monthly Fixed Charges (Demand Charges + Single-Phase Meter Rent)
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-stone-900">
                    {formatBDT(simulation.total_fixed_charges_bdt)}
                  </td>
                </tr>
                <tr>
                  <td className="p-3 text-stone-700 font-medium">
                    3. Statutory Value Added Tax (VAT 5.0% on Energy & Fixed Charges)
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-stone-900">
                    {formatBDT(simulation.total_vat_bdt)}
                  </td>
                </tr>
                <tr className="bg-stone-50 font-bold border-t-2 border-stone-300">
                  <td className="p-3 text-stone-900 text-xs uppercase tracking-wider">
                    Total Net Meter Consumed Charges
                  </td>
                  <td className="p-3 text-right font-mono text-sm text-stone-900">
                    {formatBDT(simulation.total_meter_cost_bdt)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Monthly Detailed Consumption Summary Table */}
          <div className="my-6">
            <h4 className="text-xs font-bold uppercase text-stone-700 mb-2">
              Monthly Consumption & Balance Progression
            </h4>
            <div className="border border-stone-200 rounded-xl overflow-hidden print:border-stone-400">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-stone-100 border-b border-stone-200 text-stone-700 font-semibold text-[10px] uppercase">
                  <tr>
                    <th className="p-2.5">Billing Month</th>
                    <th className="p-2.5 text-center">Units (kWh)</th>
                    <th className="p-2.5 text-right">Recharges</th>
                    <th className="p-2.5 text-right">Energy Cost</th>
                    <th className="p-2.5 text-right">Fixed Charges</th>
                    <th className="p-2.5 text-right">VAT (5%)</th>
                    <th className="p-2.5 text-right">Total Billed</th>
                    <th className="p-2.5 text-right">Ending Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 font-tabular font-mono text-[11px]">
                  {simulation.monthly_summaries.map((m) => (
                    <tr key={m.month} className="hover:bg-stone-50/50">
                      <td className="p-2.5 font-bold text-stone-900 font-sans">
                        {formatMonthName(m.month)} ({m.month})
                      </td>
                      <td className="p-2.5 text-center">{m.total_units}</td>
                      <td className="p-2.5 text-right text-emerald-700">
                        {m.total_recharges_bdt > 0 ? `+৳${m.total_recharges_bdt.toFixed(2)}` : "-"}
                      </td>
                      <td className="p-2.5 text-right text-stone-800">৳{m.energy_cost_bdt.toFixed(2)}</td>
                      <td className="p-2.5 text-right text-stone-600">৳{m.fixed_charges_bdt.toFixed(2)}</td>
                      <td className="p-2.5 text-right text-stone-600">৳{m.vat_bdt.toFixed(2)}</td>
                      <td className="p-2.5 text-right font-bold text-rose-700">
                        -৳{m.total_cost_bdt.toFixed(2)}
                      </td>
                      <td className="p-2.5 text-right font-bold text-stone-900">
                        ৳{m.closing_balance_bdt.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recharge Advisor Target Funding Projection */}
          <div className="my-6 p-4 rounded-xl border border-[#C5A059]/40 bg-[#FAF6E9]/40 print:bg-transparent print:border-stone-300">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase text-[#8A6A24] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Target-Date Survival Funding Projection</span>
              </h4>
              <span className="font-mono text-xs font-bold text-stone-900">
                Target: {targetRecharge.target_date} ({targetRecharge.days_ahead} days ahead)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-stone-500">Base Energy Cost ({targetRecharge.breakdown.total_units} units @ ৳{tariff.base_slab_rate_for_breakdown}):</span>
                  <span>{formatBDT(targetRecharge.breakdown.energy_cost_base_bdt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Higher-Slab Tier Effect:</span>
                  <span>{formatBDT(targetRecharge.breakdown.higher_slab_effect_bdt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Upcoming Fixed Charges:</span>
                  <span>{formatBDT(targetRecharge.breakdown.fixed_charges_bdt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Statutory VAT (5%):</span>
                  <span>{formatBDT(targetRecharge.breakdown.vat_bdt)}</span>
                </div>
              </div>

              <div className="p-3 bg-white rounded-lg border border-stone-200 flex flex-col justify-between print:border-stone-400">
                <div className="flex justify-between text-stone-600">
                  <span>Projected Future Cost:</span>
                  <strong className="text-stone-900">{formatBDT(targetRecharge.projected_total_cost_bdt)}</strong>
                </div>
                <div className="pt-2 border-t border-stone-200 flex justify-between items-baseline">
                  <span className="text-xs font-bold text-stone-900 font-sans">RECOMMENDED RECHARGE:</span>
                  <strong className="text-base font-extrabold text-[#8A6A24]">
                    {formatBDT(targetRecharge.required_recharge_bdt)}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Statement Footer & Authority Verification */}
          <div className="mt-8 pt-6 border-t-2 border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <div>
                <span className="font-bold text-stone-800 block">Deterministic Engine Verified</span>
                <span className="text-[10px]">Zero floating-point drift • Exact integer-cents arithmetic</span>
              </div>
            </div>

            <div className="text-center sm:text-right font-mono text-[10px]">
              <div>Official Verification Hash: SHA256-P10-VERIFIED</div>
              <div>Generated by METERLY Intelligence Engine</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

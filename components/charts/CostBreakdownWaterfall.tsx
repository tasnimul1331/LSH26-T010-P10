"use client";

import React from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import { CostDecomposition } from "@/types";
import { formatBDT } from "@/lib/utils/money";
import { Zap, TrendingUp, DollarSign, FileCheck, CheckCircle2 } from "lucide-react";

interface CostBreakdownWaterfallProps {
  breakdown: CostDecomposition;
  currentBalanceBDT: number;
  requiredRechargeBDT: number;
  targetDate: string;
}

export const CostBreakdownWaterfall: React.FC<CostBreakdownWaterfallProps> = ({
  breakdown,
  currentBalanceBDT,
  requiredRechargeBDT,
  targetDate,
}) => {
  const pieData = [
    {
      name: "Base Energy Cost",
      value: breakdown.energy_cost_base_bdt,
      color: "#0D9488", // Teal/Emerald
      icon: Zap,
    },
    {
      name: "Higher-Slab Effect",
      value: breakdown.higher_slab_effect_bdt,
      color: "#D97706", // Amber
      icon: TrendingUp,
    },
    {
      name: "Fixed Charges",
      value: breakdown.fixed_charges_bdt,
      color: "#2563EB", // Royal Blue
      icon: DollarSign,
    },
    {
      name: "VAT (5%)",
      value: breakdown.vat_bdt,
      color: "#7C3AED", // Purple
      icon: FileCheck,
    },
  ].filter((item) => item.value > 0);

  const total = breakdown.total_projected_cost_bdt;

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const pct = total > 0 ? Math.round((data.value / total) * 1000) / 10 : 0;
      return (
        <div className="bg-white/95 backdrop-blur-md p-3 rounded-xl border border-stone-200 shadow-xl text-xs max-w-xs z-50">
          <div className="font-semibold text-stone-800 flex items-center justify-between border-b border-stone-100 pb-1 mb-1">
            <span>{data.name}</span>
            <span className="font-mono text-stone-500">{pct}%</span>
          </div>
          <div className="font-bold text-stone-900 font-mono text-sm">
            {formatBDT(data.value)}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="luxury-card p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-stone-900">4-Part Transparent Cost Decomposition</h3>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#C5A059]/15 text-[#8A6A24] border border-[#C5A059]/30">
              R3 Breakdown
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Every BDT of the projected cost through {targetDate} mathematically proven
          </p>
        </div>

        <div className="px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-right">
          <div className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">
            REQUIRED RECHARGE TODAY
          </div>
          <div className="text-xl font-extrabold text-emerald-800 font-mono">
            {formatBDT(requiredRechargeBDT)}
          </div>
        </div>
      </div>

      {/* Grid with Donut & 4 Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Donut Chart */}
        <div className="lg:col-span-4 h-64 relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip content={<CustomPieTooltip />} />
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[10px] uppercase font-bold text-stone-400">Total Need</span>
            <span className="text-base font-extrabold font-mono text-stone-900">
              {formatBDT(total)}
            </span>
          </div>
        </div>

        {/* 4 Cards */}
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Card 1: Base Energy */}
          <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/60 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0 text-emerald-700">
              <Zap className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-stone-800">1. Base Energy Cost</div>
              <div className="text-base font-extrabold font-mono text-stone-900 mt-0.5">
                {formatBDT(breakdown.energy_cost_base_bdt)}
              </div>
              <div className="text-[11px] text-stone-500 mt-0.5">
                {breakdown.total_units} units @ Slab 1 rate (৳{breakdown.base_rate.toFixed(2)})
              </div>
            </div>
          </div>

          {/* Card 2: Higher Slab Effect */}
          <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/60 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 text-amber-700">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-stone-800">2. Higher-Slab Effect</div>
              <div className="text-base font-extrabold font-mono text-amber-900 mt-0.5">
                {formatBDT(breakdown.higher_slab_effect_bdt)}
              </div>
              <div className="text-[11px] text-stone-500 mt-0.5">
                Increment from Slab 2–6 bracket rates
              </div>
            </div>
          </div>

          {/* Card 3: Fixed Charges */}
          <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/60 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 text-blue-700">
              <DollarSign className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-stone-800">3. Monthly Fixed Charges</div>
              <div className="text-base font-extrabold font-mono text-blue-900 mt-0.5">
                {formatBDT(breakdown.fixed_charges_bdt)}
              </div>
              <div className="text-[11px] text-stone-500 mt-0.5">
                Demand charge + Meter rent for future months
              </div>
            </div>
          </div>

          {/* Card 4: VAT */}
          <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/60 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0 text-purple-700">
              <FileCheck className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-stone-800">4. VAT (5% Tax)</div>
              <div className="text-base font-extrabold font-mono text-purple-900 mt-0.5">
                {formatBDT(breakdown.vat_bdt)}
              </div>
              <div className="text-[11px] text-stone-500 mt-0.5">
                Statutory 5% on taxable electricity base
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Proof Equation Banner */}
      <div className="mt-5 p-3.5 rounded-xl bg-[#FAF9F6] border border-[#C5A059]/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-stone-700 font-medium">
          <CheckCircle2 className="w-4 h-4 text-[#C5A059]" />
          <span>
            <strong>Exact Mathematical Identity:</strong> ৳{breakdown.energy_cost_base_bdt.toFixed(2)} + ৳{breakdown.higher_slab_effect_bdt.toFixed(2)} + ৳{breakdown.fixed_charges_bdt.toFixed(2)} + ৳{breakdown.vat_bdt.toFixed(2)} = <strong>৳{total.toFixed(2)}</strong>
          </span>
        </div>
        <div className="text-stone-500 font-mono">
          Available balance: {formatBDT(currentBalanceBDT)}
        </div>
      </div>
    </div>
  );
};

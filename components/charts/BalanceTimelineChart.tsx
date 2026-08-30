"use client";

import React, { useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { DailyLedgerRow } from "@/types";
import { formatBDT } from "@/lib/utils/money";
import { formatDisplayDate } from "@/lib/utils/dates";
import { Zap, ArrowUpCircle } from "lucide-react";

interface BalanceTimelineChartProps {
  ledger: DailyLedgerRow[];
  openingBalanceBDT: number;
}

export const BalanceTimelineChart: React.FC<BalanceTimelineChartProps> = ({
  ledger,
  openingBalanceBDT,
}) => {
  const [filterRange, setFilterRange] = useState<"all" | "90" | "30">("all");

  const filteredData = React.useMemo(() => {
    if (filterRange === "30") return ledger.slice(-30);
    if (filterRange === "90") return ledger.slice(-90);
    return ledger;
  }, [ledger, filterRange]);

  const rechargeEvents = filteredData.filter((d) => d.recharge_amount_bdt > 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: DailyLedgerRow = payload[0].payload;
      return (
        <div className="bg-white/95 backdrop-blur-md p-4 rounded-xl border border-stone-200 shadow-xl text-xs max-w-xs z-50">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2 mb-2">
            <span className="font-semibold text-stone-800">{formatDisplayDate(data.date)}</span>
            <span className="font-mono text-stone-500">{data.month}</span>
          </div>

          <div className="space-y-1.5 font-tabular">
            <div className="flex justify-between items-center text-stone-600">
              <span>Closing Balance:</span>
              <span className="font-bold text-stone-900 font-mono">
                {formatBDT(data.closing_balance_bdt)}
              </span>
            </div>

            {data.recharge_amount_bdt > 0 && (
              <div className="flex justify-between items-center text-emerald-600 font-semibold bg-emerald-50 px-2 py-1 rounded">
                <span className="flex items-center gap-1">
                  <ArrowUpCircle className="w-3 h-3" /> Recharge:
                </span>
                <span>+{formatBDT(data.recharge_amount_bdt)}</span>
              </div>
            )}

            <div className="flex justify-between items-center text-stone-500 pt-1">
              <span>Daily Units:</span>
              <span className="font-mono font-medium">{data.units} kWh</span>
            </div>

            <div className="flex justify-between items-center text-stone-500">
              <span>Energy Cost:</span>
              <span>{formatBDT(data.energy_cost_bdt)}</span>
            </div>

            {data.fixed_charges_bdt > 0 && (
              <div className="flex justify-between items-center text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                <span>Monthly Fixed Charge:</span>
                <span>{formatBDT(data.fixed_charges_bdt)}</span>
              </div>
            )}

            <div className="flex justify-between items-center text-stone-500">
              <span>VAT (5%):</span>
              <span>{formatBDT(data.vat_bdt)}</span>
            </div>

            <div className="flex justify-between items-center font-bold text-stone-800 pt-1 border-t border-stone-100">
              <span>Daily Meter Cost:</span>
              <span className="text-rose-600 font-mono">-{formatBDT(data.total_meter_cost_bdt)}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="luxury-card p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold text-stone-900">Reconstructed Balance Curve</h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold bg-[#C5A059]/15 text-[#8A6A24] border border-[#C5A059]/30">
              R2 Rebuilt
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Day-by-day deterministic balance trajectory with all recharge deposits pinned
          </p>
        </div>

        {/* Filter Pill */}
        <div className="flex flex-wrap items-center gap-1 bg-stone-100 p-1 rounded-lg self-start sm:self-auto text-xs font-medium max-w-full">
          <button
            onClick={() => setFilterRange("all")}
            className={`px-2.5 sm:px-3 py-1 rounded-md transition-all ${
              filterRange === "all"
                ? "bg-white text-stone-900 shadow-sm font-semibold"
                : "text-stone-500 hover:text-stone-800"
            }`}
          >
            All Time ({ledger.length}d)
          </button>
          <button
            onClick={() => setFilterRange("90")}
            className={`px-2.5 sm:px-3 py-1 rounded-md transition-all ${
              filterRange === "90"
                ? "bg-white text-stone-900 shadow-sm font-semibold"
                : "text-stone-500 hover:text-stone-800"
            }`}
          >
            90 Days
          </button>
          <button
            onClick={() => setFilterRange("30")}
            className={`px-2.5 sm:px-3 py-1 rounded-md transition-all ${
              filterRange === "30"
                ? "bg-white text-stone-900 shadow-sm font-semibold"
                : "text-stone-500 hover:text-stone-800"
            }`}
          >
            30 Days
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={filteredData}
            margin={{ top: 15, right: 15, left: 0, bottom: 5 }}
          >
            <defs>
              <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#C5A059" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#C5A059" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis
              dataKey="date"
              tickFormatter={(val) => {
                const parts = val.split("-");
                return `${parts[1]}/${parts[2]}`;
              }}
              tick={{ fill: "#6B7280", fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: "#E5E7EB" }}
            />
            <YAxis
              tickFormatter={(val) => `৳${val}`}
              tick={{ fill: "#6B7280", fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: "#E5E7EB" }}
              domain={["auto", "auto"]}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="#EF4444" strokeDasharray="3 3" />
            <Area
              type="monotone"
              dataKey="closing_balance_bdt"
              stroke="#B89340"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#balanceGradient)"
              name="Balance"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Footer */}
      <div className="mt-4 pt-4 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-500">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-[#B89340] rounded" />
            <span>Balance Trajectory</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>{rechargeEvents.length} Recharge Events Recorded</span>
          </div>
        </div>
        <div className="font-mono text-stone-600 font-semibold">
          Initial: {formatBDT(openingBalanceBDT)} → Current: {formatBDT(ledger[ledger.length - 1]?.closing_balance_bdt)}
        </div>
      </div>
    </div>
  );
};

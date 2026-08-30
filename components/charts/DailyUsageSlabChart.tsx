"use client";

import React, { useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Cell,
} from "recharts";
import { DailyLedgerRow } from "@/types";
import { formatDisplayDate } from "@/lib/utils/dates";

interface DailyUsageSlabChartProps {
  ledger: DailyLedgerRow[];
}

export const DailyUsageSlabChart: React.FC<DailyUsageSlabChartProps> = ({ ledger }) => {
  const [filterMonth, setFilterMonth] = useState<string>("all");

  const availableMonths = React.useMemo(() => {
    return Array.from(new Set(ledger.map((d) => d.month)));
  }, [ledger]);

  const filteredData = React.useMemo(() => {
    if (filterMonth === "all") return ledger;
    return ledger.filter((d) => d.month === filterMonth);
  }, [ledger, filterMonth]);

  const avgUnits = React.useMemo(() => {
    if (filteredData.length === 0) return 0;
    const sum = filteredData.reduce((acc, d) => acc + d.units, 0);
    return Math.round((sum / filteredData.length) * 10) / 10;
  }, [filteredData]);

  // Color bar according to highest slab slice in that day
  const getBarColor = (row: DailyLedgerRow) => {
    const running = row.monthly_running_units_after;
    if (running <= 75) return "#0D9488"; // Slab 1 - Emerald
    if (running <= 200) return "#2563EB"; // Slab 2 - Blue
    if (running <= 300) return "#D97706"; // Slab 3 - Amber
    if (running <= 400) return "#EA580C"; // Slab 4 - Orange
    return "#DC2626"; // Slab 5/6 - Rose
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: DailyLedgerRow = payload[0].payload;
      return (
        <div className="bg-white/95 backdrop-blur-md p-3 rounded-xl border border-stone-200 shadow-xl text-xs max-w-xs z-50">
          <div className="font-semibold text-stone-800 border-b border-stone-100 pb-1.5 mb-1.5 flex justify-between">
            <span>{formatDisplayDate(data.date)}</span>
            <span className="font-mono text-stone-500">{data.month}</span>
          </div>
          <div className="space-y-1 font-tabular">
            <div className="flex justify-between items-center text-stone-700 font-bold">
              <span>Daily Units:</span>
              <span className="font-mono text-blue-600">{data.units} kWh</span>
            </div>
            <div className="flex justify-between items-center text-stone-500">
              <span>Monthly Running Total:</span>
              <span className="font-mono">{data.monthly_running_units_after} kWh</span>
            </div>
            <div className="pt-1.5 border-t border-stone-100 text-[11px] text-stone-600 space-y-0.5">
              {data.slab_slices.map((s, idx) => (
                <div key={idx} className="flex justify-between">
                  <span className="text-stone-500">{s.slab_name}:</span>
                  <span>{s.units}u @ ৳{s.rate} = ৳{s.cost_bdt.toFixed(2)}</span>
                </div>
              ))}
            </div>
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
            <h3 className="text-lg font-bold text-stone-900">Daily Consumption & Slab Tier</h3>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              Avg {avgUnits} kWh/d
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Daily energy units color-coded by cumulative monthly slab bracket
          </p>
        </div>

        {/* Month Selector */}
        <select
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className="px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-medium text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#C5A059]/40"
        >
          <option value="all">All Recorded Months</option>
          {availableMonths.map((m) => (
            <option key={m} value={m}>
              Month {m}
            </option>
          ))}
        </select>
      </div>

      {/* Bar Chart */}
      <div className="w-full h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={filteredData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
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
              tick={{ fill: "#6B7280", fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: "#E5E7EB" }}
              unit=" u"
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              y={avgUnits}
              stroke="#D97706"
              strokeDasharray="4 4"
              label={{
                value: `Avg ${avgUnits} kWh`,
                fill: "#D97706",
                fontSize: 10,
                position: "right",
              }}
            />
            <Bar dataKey="units" radius={[3, 3, 0, 0]}>
              {filteredData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Slab Legend */}
      <div className="mt-4 pt-3 border-t border-stone-100 flex flex-wrap items-center justify-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#0D9488]" />
          <span className="text-stone-600">Slab 1 (0-75u)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#2563EB]" />
          <span className="text-stone-600">Slab 2 (76-200u)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#D97706]" />
          <span className="text-stone-600">Slab 3 (201-300u)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#EA580C]" />
          <span className="text-stone-600">Slab 4 (301-400u)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#DC2626]" />
          <span className="text-stone-600">Slab 5/6 (&gt;400u)</span>
        </div>
      </div>
    </div>
  );
};

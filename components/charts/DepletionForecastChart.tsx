"use client";

import React from "react";
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
import { DepletionForecast, DailyLedgerRow } from "@/types";
import { formatBDT } from "@/lib/utils/money";
import { formatDisplayDate } from "@/lib/utils/dates";
import { AlertTriangle, Clock } from "lucide-react";

interface DepletionForecastChartProps {
  forecast: DepletionForecast;
  historicalTail: DailyLedgerRow[];
}

export const DepletionForecastChart: React.FC<DepletionForecastChartProps> = ({
  forecast,
  historicalTail,
}) => {
  // Combine last 14 days of history + forecast days for a seamless curve
  const chartData = React.useMemo(() => {
    const historyPoints = historicalTail.slice(-14).map((d) => ({
      date: d.date,
      historicalBalance: d.closing_balance_bdt,
      forecastBalance: null as number | null,
      isHistory: true,
      units: d.units,
    }));

    // Connect today
    const lastHistory = historyPoints[historyPoints.length - 1];

    const forecastPoints = forecast.daily_forecast.map((f, idx) => ({
      date: f.date,
      historicalBalance: idx === 0 && lastHistory ? lastHistory.historicalBalance : null,
      forecastBalance: f.closing_balance_bdt,
      isHistory: false,
      units: f.units,
    }));

    return [...historyPoints, ...forecastPoints];
  }, [historicalTail, forecast]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isHist = data.isHistory;
      const bal = isHist ? data.historicalBalance : data.forecastBalance;
      const isDepleted = bal !== null && bal <= 0;

      return (
        <div className="bg-white/95 backdrop-blur-md p-3 rounded-xl border border-stone-200 shadow-xl text-xs max-w-xs z-50">
          <div className="font-semibold text-stone-800 border-b border-stone-100 pb-1.5 mb-1.5 flex justify-between">
            <span>{formatDisplayDate(data.date)}</span>
            <span
              className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                isHist ? "bg-stone-100 text-stone-600" : "bg-purple-50 text-purple-700"
              }`}
            >
              {isHist ? "Recorded History" : "Projected Forecast"}
            </span>
          </div>
          <div className="space-y-1 font-tabular">
            <div className="flex justify-between items-center text-stone-700 font-bold">
              <span>{isHist ? "Closing Balance:" : "Projected Balance:"}</span>
              <span className={`font-mono ${isDepleted ? "text-rose-600" : "text-stone-900"}`}>
                {bal !== null ? formatBDT(bal) : "N/A"}
              </span>
            </div>
            <div className="flex justify-between items-center text-stone-500">
              <span>Daily Consumption:</span>
              <span className="font-mono">{data.units} kWh</span>
            </div>
            {isDepleted && (
              <div className="text-rose-600 font-medium bg-rose-50 p-1.5 rounded flex items-center gap-1 mt-1">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Zero funds remaining on this date</span>
              </div>
            )}
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
            <h3 className="text-base sm:text-lg font-bold text-stone-900">Depletion Runway Forecast</h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {forecast.depletion_date
                ? `Depletes in ${forecast.days_remaining} days`
                : "Funded > 180 days"}
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Deterministic daily depletion projection based on {forecast.usual_daily_units} kWh/day normal consumption
          </p>
        </div>

        {forecast.depletion_date && (
          <div className="px-3.5 py-2 bg-rose-50/80 border border-rose-200/80 rounded-xl self-start sm:self-auto text-left sm:text-right">
            <div className="text-[10px] uppercase font-bold text-rose-600 tracking-wider">
              ESTIMATED DEPLETION DATE
            </div>
            <div className="text-sm font-extrabold text-rose-900 font-mono">
              {formatDisplayDate(forecast.depletion_date)}
            </div>
          </div>
        )}
      </div>

      {/* Forecast Chart */}
      <div className="w-full h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
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
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="#EF4444" strokeWidth={1.5} strokeDasharray="4 4" />
            {forecast.depletion_date && (
              <ReferenceLine
                x={forecast.depletion_date}
                stroke="#DC2626"
                strokeDasharray="3 3"
                label={{
                  value: "Depletion",
                  fill: "#DC2626",
                  fontSize: 10,
                  position: "insideTopRight",
                }}
              />
            )}
            <Line
              type="monotone"
              dataKey="historicalBalance"
              stroke="#B89340"
              strokeWidth={2.5}
              dot={false}
              name="Historical Balance"
            />
            <Line
              type="monotone"
              dataKey="forecastBalance"
              stroke="#8B5CF6"
              strokeWidth={2.5}
              strokeDasharray="4 4"
              dot={false}
              name="Projected Forecast"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-4 pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between text-xs text-stone-500">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-[#B89340] rounded" />
            <span>Actual History (Past 14 Days)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-purple-500 border-b border-dashed border-purple-500" />
            <span>Projected Runway (Future)</span>
          </div>
        </div>
        <div className="font-mono text-stone-600">
          Assumed: {forecast.usual_daily_units} kWh/day • 0 future deposits
        </div>
      </div>
    </div>
  );
};

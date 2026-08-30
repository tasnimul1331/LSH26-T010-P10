"use client";

import React, { useState, useMemo } from "react";
import { useCase } from "@/components/context/CaseContext";
import { validateCaseIntegrity } from "@/lib/validation/case-schema";
import { formatBDT } from "@/lib/utils/money";
import { formatDisplayDate, formatMonthName } from "@/lib/utils/dates";
import {
  Database,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  SunMedium,
  Feather,
  ArrowUpCircle,
  FileJson,
  Layers,
} from "lucide-react";

export default function CaseDataPage() {
  const { caseData } = useCase();
  const [copied, setCopied] = useState(false);

  if (!caseData) return null;

  const validation = useMemo(() => {
    return validateCaseIntegrity(caseData);
  }, [caseData]);

  // Analyze monthly characteristics for R1 (Light Month, Heavy Month, Large Recharges)
  const monthlyStats = useMemo(() => {
    const map = new Map<string, { units: number; recharges: { date: string; amount: number }[] }>();
    for (const d of caseData.days) {
      const m = d.date.substring(0, 7);
      const entry = map.get(m) || { units: 0, recharges: [] };
      entry.units += d.units;
      map.set(m, entry);
    }
    for (const r of caseData.recharges) {
      const m = r.date.substring(0, 7);
      const entry = map.get(m) || { units: 0, recharges: [] };
      entry.recharges.push({ date: r.date, amount: parseFloat(r.amount_bdt) });
      map.set(m, entry);
    }

    const monthsArr = Array.from(map.entries()).map(([month, data]) => ({
      month,
      units: data.units,
      recharges: data.recharges,
    }));

    if (monthsArr.length === 0) return null;

    let light = monthsArr[0];
    let heavy = monthsArr[0];

    for (const m of monthsArr) {
      if (m.units < light.units) light = m;
      if (m.units > heavy.units) heavy = m;
    }

    // Check last week large recharge (day >= 24)
    const largeLastWeekRecharges = caseData.recharges.filter((r) => {
      const day = parseInt(r.date.substring(8, 10), 10);
      const amount = parseFloat(r.amount_bdt);
      return day >= 24 && amount >= 500;
    });

    return {
      lightMonth: light,
      heavyMonth: heavy,
      largeLastWeekRecharges,
      monthsCount: monthsArr.length,
      allMonths: monthsArr,
    };
  }, [caseData]);

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(caseData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">
              Case Data & Audit Ingestion
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#C5A059]/15 text-[#8A6A24] border border-[#C5A059]/30">
              Data Verification
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Validating 6+ months schema, consecutive daily readings, and challenge characteristics
          </p>
        </div>

        <button
          onClick={handleCopyJSON}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 text-xs font-semibold text-stone-700 shadow-2xs transition-all self-start md:self-auto"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Copied JSON</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Raw JSON</span>
            </>
          )}
        </button>
      </div>

      {/* R1 Characteristic Cards (Light Month, Heavy Summer Month, Last-Week Recharge) */}
      {monthlyStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Light Month */}
          <div className="luxury-card p-5 border-blue-200/60 bg-blue-50/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                <Feather className="w-4 h-4 text-blue-600" />
                <span>Light Month (Winter)</span>
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                {monthlyStats.lightMonth.month}
              </span>
            </div>
            <div className="text-2xl font-extrabold font-mono text-blue-900 mt-1">
              {monthlyStats.lightMonth.units} kWh
            </div>
            <p className="text-[11px] text-stone-500 mt-1">
              Lowest baseline consumption observed in recorded timeline
            </p>
          </div>

          {/* Heavy Summer Month */}
          <div className="luxury-card p-5 border-amber-200/60 bg-amber-50/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <SunMedium className="w-4 h-4 text-amber-600" />
                <span>Heavy Summer Month</span>
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                {monthlyStats.heavyMonth.month}
              </span>
            </div>
            <div className="text-2xl font-extrabold font-mono text-amber-900 mt-1">
              {monthlyStats.heavyMonth.units} kWh
            </div>
            <p className="text-[11px] text-stone-500 mt-1">
              Peak summer cooling usage crossing higher tariff slabs
            </p>
          </div>

          {/* Last-Week Large Recharge */}
          <div className="luxury-card p-5 border-emerald-200/60 bg-emerald-50/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <ArrowUpCircle className="w-4 h-4 text-emerald-600" />
                <span>Last-Week Large Recharge</span>
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                {monthlyStats.largeLastWeekRecharges.length} Found
              </span>
            </div>
            <div className="text-2xl font-extrabold font-mono text-emerald-900 mt-1">
              {monthlyStats.largeLastWeekRecharges[0]
                ? `৳${parseFloat(monthlyStats.largeLastWeekRecharges[0].amount_bdt).toFixed(2)}`
                : "None"}
            </div>
            <p className="text-[11px] text-stone-500 mt-1">
              {monthlyStats.largeLastWeekRecharges[0]
                ? `Recharged on ${formatDisplayDate(monthlyStats.largeLastWeekRecharges[0].date)}`
                : "Recharge events tracked in last week of month"}
            </p>
          </div>
        </div>
      )}

      {/* Validation Checklist Report */}
      <div className="luxury-card p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold text-stone-900">Schema Integrity Verification</h3>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                validation.is_valid
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-rose-100 text-rose-800"
              }`}
            >
              {validation.is_valid ? "ALL CHECKS PASSED" : "VALIDATION ISSUES"}
            </span>
          </div>
          <span className="text-xs text-stone-400 font-mono">
            Case ID: {caseData.case_id}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {validation.checks.map((chk, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl border border-stone-200 bg-stone-50/50 flex items-start gap-3"
            >
              {chk.passed ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="text-xs">
                <div className="font-semibold text-stone-800">{chk.name}</div>
                <p className="text-stone-500 text-[11px] mt-0.5">{chk.message}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Telemetry & Seasonal Profile Matrix Table */}
      {monthlyStats && (
        <div className="luxury-card p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-base font-bold text-stone-900">Recorded Months Telemetry Matrix</h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Seasonal profile, average daily consumption, and recharge deposit volume across all {monthlyStats.monthsCount} months
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-[#8A6A24] bg-[#C5A059]/10 px-2.5 py-1 rounded-full self-start sm:self-auto">
              {monthlyStats.monthsCount} Months Ingested
            </span>
          </div>

          <div className="overflow-x-auto border border-stone-200 rounded-xl">
            <table className="w-full text-xs text-left min-w-[650px]">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3">Month</th>
                  <th className="p-3 text-center">Seasonal Profile</th>
                  <th className="p-3 text-right">Total Units</th>
                  <th className="p-3 text-right">Avg Daily Usage</th>
                  <th className="p-3 text-right">Recharge Events</th>
                  <th className="p-3 text-right">Total Deposited</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-tabular font-mono">
                {monthlyStats.allMonths.map((m) => {
                  const daysInMonth = caseData.days.filter((d) => d.date.startsWith(m.month)).length || 1;
                  const avgDaily = (m.units / daysInMonth).toFixed(1);
                  const totalDeposited = m.recharges.reduce((acc, r) => acc + r.amount, 0);

                  const isLight = m.month === monthlyStats.lightMonth.month;
                  const isHeavy = m.month === monthlyStats.heavyMonth.month;

                  return (
                    <tr key={m.month} className="hover:bg-stone-50/60">
                      <td className="p-3 font-semibold text-stone-900 font-sans">
                        {formatMonthName(m.month)} ({m.month})
                      </td>
                      <td className="p-3 text-center font-sans">
                        {isLight ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
                            Light Month
                          </span>
                        ) : isHeavy ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Heavy Summer Peak
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-stone-100 text-stone-600">
                            Normal Consumption
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right font-bold text-stone-900">
                        {m.units} kWh
                      </td>
                      <td className="p-3 text-right text-stone-600">
                        {avgDaily} kWh/day
                      </td>
                      <td className="p-3 text-right text-stone-600">
                        {m.recharges.length} {m.recharges.length === 1 ? "deposit" : "deposits"}
                      </td>
                      <td className="p-3 text-right font-bold text-emerald-700">
                        {totalDeposited > 0 ? formatBDT(totalDeposited) : "৳0.00"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recharge Events Audit Log */}
      <div className="luxury-card p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-stone-900">Recharge Transactions Log</h3>
            <p className="text-xs text-stone-500 mt-0.5">
              All {caseData.recharges.length} deposit events recorded in this case timeline
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            {caseData.recharges.length} Transactions
          </span>
        </div>

        <div className="overflow-x-auto border border-stone-200 rounded-xl">
          <table className="w-full text-xs text-left min-w-[550px]">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3">#</th>
                <th className="p-3">Deposit Date</th>
                <th className="p-3">Month Period</th>
                <th className="p-3">Timing Classification</th>
                <th className="p-3 text-right">Amount (BDT)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-tabular font-mono">
              {caseData.recharges.map((r, idx) => {
                const dayNum = parseInt(r.date.substring(8, 10), 10);
                const isLateWeek = dayNum >= 24;
                const isFirstWeek = dayNum <= 7;
                const amount = parseFloat(r.amount_bdt);

                return (
                  <tr key={idx} className="hover:bg-stone-50/60">
                    <td className="p-3 text-stone-400 font-mono">{idx + 1}</td>
                    <td className="p-3 font-semibold text-stone-900">
                      {formatDisplayDate(r.date)}
                    </td>
                    <td className="p-3 text-stone-600 font-sans">
                      {formatMonthName(r.date.substring(0, 7))}
                    </td>
                    <td className="p-3 font-sans">
                      {isLateWeek && amount >= 500 ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          Late-Month Large Deposit (Day {dayNum})
                        </span>
                      ) : isFirstWeek ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700">
                          1st-Week Deposit (Day {dayNum})
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-stone-100 text-stone-600">
                          Mid-Month (Day {dayNum})
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right font-extrabold text-emerald-700">
                      +{formatBDT(amount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Clean Collapsible Developer JSON Inspector */}
      <div className="luxury-card p-4 sm:p-6 border-dashed border-stone-300">
        <details className="group cursor-pointer">
          <summary className="flex items-center justify-between text-xs font-bold text-stone-700 select-none">
            <div className="flex items-center gap-2">
              <FileJson className="w-4 h-4 text-[#8A6A24]" />
              <span>Developer & Judge Raw JSON Schema (Click to expand)</span>
            </div>
            <span className="text-[11px] text-stone-400 group-open:hidden font-normal font-mono">
              Show JSON ({caseData.days.length} readings)
            </span>
          </summary>
          <div className="mt-4 pt-3 border-t border-stone-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-stone-500 font-mono">
                {caseData.days.length} readings • {caseData.recharges.length} recharges
              </span>
              <button
                onClick={handleCopyJSON}
                className="flex items-center gap-1 px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] rounded-lg transition-all"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? "Copied!" : "Copy JSON"}</span>
              </button>
            </div>
            <pre className="p-3 bg-stone-900 text-stone-200 text-[11px] font-mono rounded-xl overflow-x-auto max-h-60">
              {JSON.stringify(caseData, null, 2)}
            </pre>
          </div>
        </details>
      </div>
    </div>
  );
}

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
      <div className="luxury-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-stone-900">Zod Schema Integrity Verification</h3>
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

      {/* Raw JSON Preview */}
      <div className="luxury-card p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
            <FileJson className="w-4 h-4 text-[#8A6A24]" />
            <span>Raw Case JSON Definition</span>
          </h3>
          <span className="text-xs text-stone-400 font-mono">
            {caseData.days.length} readings • {caseData.recharges.length} recharges
          </span>
        </div>

        <pre className="p-4 bg-stone-900 text-stone-200 text-xs font-mono rounded-xl overflow-x-auto max-h-96">
          {JSON.stringify(caseData, null, 2)}
        </pre>
      </div>
    </div>
  );
}

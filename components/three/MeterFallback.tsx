"use client";

import React from "react";
import { Zap, ShieldCheck, Activity } from "lucide-react";
import { formatBDT } from "@/lib/utils/money";

interface MeterFallbackProps {
  balanceBDT: number;
  todayDate: string;
  totalUnits: number;
  caseId: string;
}

export const MeterFallback: React.FC<MeterFallbackProps> = ({
  balanceBDT,
  todayDate,
  totalUnits,
  caseId,
}) => {
  const isHealthy = balanceBDT > 300;
  const isWarning = balanceBDT <= 300 && balanceBDT > 100;
  const isCritical = balanceBDT <= 100;

  const statusColor = isHealthy
    ? "bg-emerald-500 text-emerald-700 border-emerald-300"
    : isWarning
    ? "bg-amber-500 text-amber-700 border-amber-300"
    : "bg-rose-500 text-rose-700 border-rose-300";

  const glowColor = isHealthy
    ? "rgba(16, 185, 129, 0.15)"
    : isWarning
    ? "rgba(245, 158, 11, 0.15)"
    : "rgba(244, 63, 94, 0.15)";

  return (
    <div
      className="relative w-full max-w-sm rounded-2xl p-6 border transition-all duration-300 shadow-xl overflow-hidden"
      style={{
        background: "linear-gradient(145deg, #2D2B3F 0%, #1A1826 100%)",
        borderColor: "rgba(197, 160, 89, 0.3)",
        boxShadow: `0 12px 36px -4px ${glowColor}`,
      }}
    >
      {/* Metallic Chassis Highlights */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#C5A059] to-transparent opacity-60" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent pointer-events-none" />

      {/* Meter Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/10">
            <Zap className="w-4 h-4 text-[#C5A059]" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider font-semibold text-white/50">
              Smart Prepaid Meter
            </div>
            <div className="text-xs font-bold text-white font-mono">{caseId}</div>
          </div>
        </div>

        {/* Dynamic Status LED */}
        <div className="flex items-center gap-2 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
          <span
            className={`w-2 h-2 rounded-full animate-led ${
              isHealthy ? "bg-emerald-400" : isWarning ? "bg-amber-400" : "bg-rose-400"
            }`}
          />
          <span className="text-[11px] font-medium text-white/80">
            {isHealthy ? "Active • Normal" : isWarning ? "Low Balance" : "Critical"}
          </span>
        </div>
      </div>

      {/* OLED Screen Display */}
      <div className="my-5 p-4 rounded-xl bg-black/60 border border-white/10 backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-2 right-2 text-[9px] font-mono text-[#C5A059]/80 uppercase tracking-widest flex items-center gap-1">
          <Activity className="w-3 h-3 text-[#C5A059] animate-pulse" /> LIVE TELEMETRY
        </div>

        <div className="text-[11px] font-medium text-white/60 mb-1">CURRENT BALANCE</div>
        <div className="text-3xl font-extrabold font-mono text-white tracking-tight flex items-baseline gap-1">
          <span className="text-xl text-[#C5A059]">BDT</span>
          <span>{formatBDT(balanceBDT, false)}</span>
        </div>

        <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-white/70">
          <div>
            <span className="text-white/40 text-[10px] block">CUMULATIVE UNITS</span>
            <span className="font-mono font-semibold text-white">{totalUnits} kWh</span>
          </div>
          <div className="text-right">
            <span className="text-white/40 text-[10px] block">AS OF DATE</span>
            <span className="font-mono font-semibold text-white">{todayDate}</span>
          </div>
        </div>
      </div>

      {/* Security & Invariant Seal */}
      <div className="flex items-center justify-between text-[11px] text-white/60 pt-1">
        <div className="flex items-center gap-1.5 text-white/70">
          <ShieldCheck className="w-3.5 h-3.5 text-[#C5A059]" />
          <span>Deterministic Lock</span>
        </div>
        <span className="font-mono text-[10px] text-white/40">BERC LT-A SPEC</span>
      </div>
    </div>
  );
};

"use client";

import React, { useState } from "react";
import { useCase } from "@/components/context/CaseContext";
import { formatBDT } from "@/lib/utils/money";
import {
  Settings,
  ShieldCheck,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  DollarSign,
  FileCode2,
  Sparkles,
} from "lucide-react";

export default function TariffPage() {
  const { tariff, refreshData } = useCase();
  const [isUpdating, setIsUpdating] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  if (!tariff) return null;

  const handleToggleUnavailable = async () => {
    try {
      setIsUpdating(true);
      const res = await fetch("/api/tariff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unavailable_mode: tariff.is_configured }),
      });
      const json = await res.json();
      if (json.success) {
        setMsg(json.message);
        refreshData();
      }
    } catch (err: any) {
      setMsg(`Error: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResetDefault = async () => {
    try {
      setIsUpdating(true);
      const res = await fetch("/api/tariff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reset_default: true }),
      });
      const json = await res.json();
      if (json.success) {
        setMsg("Tariff reset to official BERC LT-A default");
        refreshData();
      }
    } catch (err: any) {
      setMsg(`Error: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">
              Tariff Configuration Center
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#C5A059]/15 text-[#8A6A24] border border-[#C5A059]/30">
              BERC Official
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Authoritative Bangladesh Energy Regulatory Commission LT-A Domestic Prepaid Tariff specification
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetDefault}
            disabled={isUpdating}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 text-xs font-semibold text-stone-700 shadow-2xs transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Authoritative Default</span>
          </button>
        </div>
      </div>

      {msg && (
        <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {/* Unavailable Test Mode Banner */}
      {!tariff.is_configured ? (
        <div className="luxury-card p-6 bg-amber-50/70 border-amber-300 text-amber-900 space-y-2">
          <div className="flex items-center gap-2 font-bold text-base text-amber-900">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <span>Tariff Configuration Unavailable</span>
          </div>
          <p className="text-xs text-amber-800 leading-relaxed">
            Per PRD Section 3 / FR-02: Calculations are safely blocked to prevent false numerical results when authoritative tariff configuration is unavailable.
          </p>
          <button
            onClick={handleResetDefault}
            className="mt-3 px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
          >
            Restore Active Tariff Configuration
          </button>
        </div>
      ) : (
        <div className="luxury-card p-5 bg-[#FAF6E9]/40 border-[#C5A059]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C5A059]/20 text-[#8A6A24] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-stone-900">Authoritative Spec Loaded</div>
              <div className="text-[11px] text-stone-500 font-mono">
                {tariff.name} (Effective {tariff.effective_date})
              </div>
            </div>
          </div>

          <button
            onClick={handleToggleUnavailable}
            disabled={isUpdating}
            className="px-3.5 py-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-600 text-xs font-medium self-start sm:self-auto transition-all"
          >
            Test "Tariff Unavailable" Fallback
          </button>
        </div>
      )}

      {/* Tariff Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="luxury-card p-4">
          <span className="text-[10px] font-bold text-stone-400 uppercase">Demand Charge</span>
          <div className="text-xl font-extrabold font-mono text-stone-900 mt-1">
            ৳{tariff.demand_charge_bdt_per_kw_month.toFixed(2)}
          </div>
          <span className="text-[11px] text-stone-500">per kW sanctioned / month</span>
        </div>

        <div className="luxury-card p-4">
          <span className="text-[10px] font-bold text-stone-400 uppercase">Single-Phase Meter Rent</span>
          <div className="text-xl font-extrabold font-mono text-stone-900 mt-1">
            ৳{tariff.meter_rent_bdt_per_month.toFixed(2)}
          </div>
          <span className="text-[11px] text-stone-500">per month flat</span>
        </div>

        <div className="luxury-card p-4">
          <span className="text-[10px] font-bold text-stone-400 uppercase">Statutory VAT</span>
          <div className="text-xl font-extrabold font-mono text-stone-900 mt-1">
            {tariff.vat_percentage}%
          </div>
          <span className="text-[11px] text-stone-500">applied on energy & fixed charges</span>
        </div>

        <div className="luxury-card p-4">
          <span className="text-[10px] font-bold text-stone-400 uppercase">Fixed Charge Rule</span>
          <div className="text-sm font-extrabold font-mono text-stone-900 mt-1 truncate">
            First Recharge of Month
          </div>
          <span className="text-[11px] text-stone-500">triggers on month's 1st deposit</span>
        </div>
      </div>

      {/* Slabs Matrix Table */}
      <div className="luxury-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-stone-900">Residential Slab Rate Matrix</h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Units in a calendar month are sliced across these slab tiers
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-[#8A6A24] bg-[#C5A059]/10 px-2.5 py-1 rounded-full">
            {tariff.slabs.length} Slabs Configured
          </span>
        </div>

        <div className="overflow-x-auto border border-stone-200 rounded-xl">
          <table className="w-full text-xs text-left min-w-[640px]">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3">Slab Identifier</th>
                <th className="p-3">Display Name</th>
                <th className="p-3 text-center">Unit Threshold</th>
                <th className="p-3 text-right">Energy Rate (BDT/kWh)</th>
                <th className="p-3 text-right">Base / Tier Ratio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-tabular font-mono">
              {tariff.slabs.map((slab) => {
                const ratio =
                  tariff.base_slab_rate_for_breakdown > 0
                    ? (slab.rate_per_unit_bdt / tariff.base_slab_rate_for_breakdown).toFixed(2)
                    : "1.00";
                return (
                  <tr key={slab.slab_id} className="hover:bg-stone-50/60">
                    <td className="p-3 font-semibold text-stone-900">{slab.slab_id}</td>
                    <td className="p-3 font-medium text-stone-700">{slab.name}</td>
                    <td className="p-3 text-center text-stone-600">
                      {slab.min_units} – {slab.max_units !== null ? `${slab.max_units} kWh` : "Above"}
                    </td>
                    <td className="p-3 text-right font-extrabold text-stone-900">
                      ৳{slab.rate_per_unit_bdt.toFixed(2)}
                    </td>
                    <td className="p-3 text-right text-stone-500 font-medium">
                      {ratio}x base
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

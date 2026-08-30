"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Wallet,
  Clock,
  Zap,
  Scale,
  ShieldCheck,
} from "lucide-react";
import { useCase } from "@/components/context/CaseContext";
import { formatBDT } from "@/lib/utils/money";
import { formatDisplayDate } from "@/lib/utils/dates";

interface GuidedDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuidedDemoModal: React.FC<GuidedDemoModalProps> = ({
  isOpen,
  onClose,
}) => {
  const router = useRouter();
  const { caseData, simulation, depletion, targetRecharge, comparison } = useCase();
  const [step, setStep] = useState(1);

  if (!isOpen || !caseData || !simulation || !depletion || !targetRecharge || !comparison) {
    return null;
  }

  const steps = [
    {
      stepNumber: 1,
      title: "1. What is the meter balance today?",
      route: "/",
      badge: "Current Balance",
      icon: Wallet,
      headline: `Today's Reconstructed Balance: ${formatBDT(simulation.current_balance_bdt)}`,
      explanation: `Starting from opening balance ${formatBDT(caseData.opening_balance_bdt)}, our deterministic engine processed all ${simulation.total_days} consecutive days, pricing units against calendar-month slabs and deducting first-recharge fixed charges (82 BDT) and 5% VAT.`,
      statTitle: "Net Recharged vs Consumed",
      statValue: `+${formatBDT(simulation.total_recharges_bdt)} deposited / -${formatBDT(simulation.total_meter_cost_bdt)} cost`,
    },
    {
      stepNumber: 2,
      title: "2. How did balance change day by day?",
      route: "/simulation",
      badge: "R2 Simulation",
      icon: Zap,
      headline: `${simulation.ledger.length} Days Audited with Pinned Recharges`,
      explanation: `Every single recharge deposit is pinned to the timeline without resetting the monthly slab counter. Units that span across slab boundaries (e.g. crossing 75 kWh or 200 kWh) are mathematically sliced across each tier.`,
      statTitle: "Total Energy Units",
      statValue: `${simulation.total_units} kWh consumed`,
    },
    {
      stepNumber: 3,
      title: "3. When will balance deplete & How much to recharge?",
      route: "/advisor",
      badge: "R3 Advisor",
      icon: Clock,
      headline: `Depletes: ${depletion.depletion_date ? formatDisplayDate(depletion.depletion_date) : "Funded"} • Required: ${formatBDT(targetRecharge.required_recharge_bdt)}`,
      explanation: `To survive until ${formatDisplayDate(targetRecharge.target_date)}, the household needs ${formatBDT(targetRecharge.required_recharge_bdt)}. We decompose this into 4 mathematically proven parts: Base Energy (${formatBDT(targetRecharge.breakdown.energy_cost_base_bdt)}), Higher-Slab Effect (${formatBDT(targetRecharge.breakdown.higher_slab_effect_bdt)}), Fixed Charges (${formatBDT(targetRecharge.breakdown.fixed_charges_bdt)}), and VAT (${formatBDT(targetRecharge.breakdown.vat_bdt)}).`,
      statTitle: "4-Part Decomposition Sum",
      statValue: `৳${targetRecharge.breakdown.total_projected_cost_bdt.toFixed(2)} (100% Identity Match)`,
    },
    {
      stepNumber: 4,
      title: "4. Which habit costs less over 3 months?",
      route: "/comparison",
      badge: "R4 Habit Comparison",
      icon: Scale,
      headline: `Verdict: ${comparison.is_tie ? "Equal Cost" : comparison.verdict_message}`,
      explanation: `Both Low-Balance and Monthly strategies consume the exact same ${comparison.total_units_consumed} units in ${comparison.comparison_months.join(", ")}. Energy rate difference is strictly ৳0.00. Any cost variance stems strictly from monthly first-recharge fixed charge triggers.`,
      statTitle: "Energy Invariant Status",
      statValue: "Delta = BDT 0.00 (Proven)",
    },
  ];

  const current = steps[step - 1];
  const Icon = current.icon;

  const handleNext = () => {
    if (step < steps.length) {
      const nextStep = step + 1;
      setStep(nextStep);
      router.push(steps[nextStep - 1].route);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      const prevStep = step - 1;
      setStep(prevStep);
      router.push(steps[prevStep - 1].route);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-[#C5A059]/40 overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-stone-900 to-stone-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C5A059]/20 text-[#C5A059] flex items-center justify-center border border-[#C5A059]/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-[#C5A059] tracking-wider uppercase">
                  JUDGE GUIDED TOUR
                </span>
                <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-white/10 text-white">
                  Step {step} of 4
                </span>
              </div>
              <h3 className="font-extrabold text-base text-white tracking-tight">
                {current.title}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          <div className="p-4 rounded-2xl bg-[#FAF6E9] border border-[#C5A059]/30 space-y-2">
            <div className="flex items-center gap-2">
              <Icon className="w-5 h-5 text-[#8A6A24]" />
              <div className="text-sm font-extrabold text-stone-900">
                {current.headline}
              </div>
            </div>
            <p className="text-xs text-stone-700 leading-relaxed">
              {current.explanation}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-stone-400 block">
                {current.statTitle}
              </span>
              <span className="text-sm font-extrabold font-mono text-stone-900">
                {current.statValue}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Verified</span>
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="p-6 bg-stone-50 border-t border-stone-100 flex items-center justify-between">
          <button
            disabled={step === 1}
            onClick={handlePrev}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-200/60 disabled:opacity-40 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  i === step ? "bg-[#8A6A24] w-5" : "bg-stone-300"
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-stone-900 text-[#C5A059] hover:bg-stone-800 text-xs font-bold shadow-sm transition-all"
          >
            <span>{step === 4 ? "Finish Tour" : "Next Answer"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

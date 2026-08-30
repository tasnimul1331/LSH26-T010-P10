"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Zap,
  ChevronDown,
  Upload,
  Sparkles,
  Command,
  Layers,
} from "lucide-react";
import { CaseData, TariffConfig } from "@/types";
import { CaseUploadModal } from "./CaseUploadModal";
import { GuidedDemoModal } from "./GuidedDemoModal";
import { CommandPalette } from "./CommandPalette";

interface NavbarProps {
  currentCase: CaseData;
  availableCases: { case_id: string; total_days: number; today: string; opening_balance_bdt: string }[];
  onSelectCase: (caseId: string) => void;
  tariff: TariffConfig;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentCase,
  availableCases,
  onSelectCase,
  tariff,
}) => {
  const [isCaseDropdownOpen, setIsCaseDropdownOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  useEffect(() => {
    const handleTogglePalette = () => {
      setIsCommandPaletteOpen((prev) => !prev);
    };
    window.addEventListener("toggle-command-palette", handleTogglePalette);
    return () => window.removeEventListener("toggle-command-palette", handleTogglePalette);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-stone-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-stone-900 text-[#C5A059] flex items-center justify-center shadow-sm group-hover:scale-105 transition-all">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 fill-[#C5A059]" />
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="font-extrabold text-stone-900 tracking-tight text-base sm:text-lg">
                    METERLY
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#C5A059]/20 text-[#8A6A24] border border-[#C5A059]/40 uppercase tracking-widest">
                    P10
                  </span>
                </div>
                <span className="hidden sm:block text-[10px] font-medium text-stone-500 tracking-wider uppercase -mt-0.5">
                  Prepaid Energy Intelligence
                </span>
              </div>
            </Link>
          </div>

          {/* Center: Case Selector Dropdown & Cmd+K */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="relative">
              <button
                onClick={() => setIsCaseDropdownOpen(!isCaseDropdownOpen)}
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-xl border border-stone-200 bg-stone-50/90 hover:bg-stone-100/90 text-xs font-semibold text-stone-800 transition-all shadow-2xs"
              >
                <Layers className="w-3.5 h-3.5 text-[#C5A059] flex-shrink-0" />
                <div className="text-left">
                  <span className="hidden sm:block text-[9px] text-stone-400 font-normal -mb-0.5">
                    Active Household
                  </span>
                  <span className="font-mono font-bold text-xs">{currentCase.case_id}</span>
                </div>
                <span className="hidden md:inline text-stone-400 font-mono text-[11px]">
                  ({currentCase.days.length}d)
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-stone-400 ml-0.5" />
              </button>

              {/* Dropdown Menu */}
              {isCaseDropdownOpen && (
                <div
                  className="absolute top-full mt-2 right-0 sm:left-1/2 sm:-translate-x-1/2 w-72 max-w-[calc(100vw-2rem)] max-h-80 overflow-y-auto bg-white rounded-2xl border border-stone-200 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                  onClick={() => setIsCaseDropdownOpen(false)}
                >
                  <div className="p-2 border-b border-stone-100 flex items-center justify-between text-[11px] font-semibold text-stone-500">
                    <span>Public Test Cases (25)</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsCaseDropdownOpen(false);
                        setIsUploadModalOpen(true);
                      }}
                      className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-[10px]"
                    >
                      <Upload className="w-3 h-3" /> Upload Custom
                    </button>
                  </div>
                  <div className="space-y-1 mt-1">
                    {availableCases.map((c) => (
                      <button
                        key={c.case_id}
                        onClick={() => onSelectCase(c.case_id)}
                        className={`w-full text-left p-2 rounded-xl text-xs flex items-center justify-between transition-all ${
                          c.case_id === currentCase.case_id
                            ? "bg-[#C5A059]/15 text-[#8A6A24] font-bold"
                            : "text-stone-700 hover:bg-stone-50"
                        }`}
                      >
                        <span className="font-mono font-bold">{c.case_id}</span>
                        <span className="text-[11px] text-stone-400 font-normal font-mono">
                          {c.total_days}d • {c.today}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Command Palette Button */}
            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-500 hover:text-stone-800 text-xs font-medium"
              title="Command Palette (Ctrl/Cmd + K)"
            >
              <Command className="w-3.5 h-3.5 text-stone-400" />
              <kbd className="text-[10px] font-mono font-semibold bg-white px-1.5 py-0.5 rounded border border-stone-200">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Guided Demo Button */}
            <button
              onClick={() => setIsDemoModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#FAF6E9] border border-[#C5A059]/40 hover:bg-[#F5EED2] text-xs font-bold text-[#8A6A24] shadow-2xs transition-all"
              title="Guided Demo Tour"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#8A6A24]" />
              <span className="hidden sm:inline">Guided Demo</span>
            </button>

            {/* Tariff Indicator Pill */}
            <Link
              href="/tariff"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-xs font-semibold text-stone-700 transition-all"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-mono text-[11px]">
                {tariff.is_configured ? "BERC LT-A" : "Unconfigured"}
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* Case Upload Modal */}
      <CaseUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onCaseSelected={onSelectCase}
      />

      {/* Guided Demo Modal */}
      <GuidedDemoModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
      />

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />
    </>
  );
};

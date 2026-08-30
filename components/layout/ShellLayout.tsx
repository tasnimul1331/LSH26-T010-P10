"use client";

import React from "react";
import { useCase } from "@/components/context/CaseContext";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { Zap, AlertCircle } from "lucide-react";

export const ShellLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { caseData, availableCases, setCurrentCaseId, tariff, isLoading, error } = useCase();

  if (isLoading || !caseData || !tariff) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF9F6] p-4 sm:p-6 text-center animate-in fade-in duration-500">
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-2xl bg-stone-900 text-[#C5A059] flex items-center justify-center shadow-xl border border-[#C5A059]/30 relative z-10">
            <Zap className="w-8 h-8 fill-[#C5A059] animate-pulse" />
          </div>
          <div className="absolute inset-0 rounded-2xl bg-[#C5A059]/20 blur-xl animate-pulse" />
        </div>
        <h2 className="text-xl font-extrabold text-stone-900 tracking-tight">METERLY Energy Intelligence</h2>
        <p className="text-xs text-stone-500 mt-1.5 max-w-sm">
          Ingesting case telemetry and compiling BERC tariff specifications...
        </p>
        <div className="w-36 h-1 bg-stone-200 rounded-full mt-6 overflow-hidden relative">
          <div className="absolute inset-0 bg-[#C5A059] rounded-full animate-indeterminate" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6] p-4 sm:p-6">
        <div className="max-w-md w-full p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 space-y-3">
          <div className="flex items-center gap-2 font-bold text-base">
            <AlertCircle className="w-5 h-5 text-rose-600" />
            <span>Initialization Error</span>
          </div>
          <p className="text-xs text-rose-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] max-w-full overflow-x-hidden animate-in fade-in duration-300">
      <Navbar
        currentCase={caseData}
        availableCases={availableCases}
        onSelectCase={setCurrentCaseId}
        tariff={tariff}
      />
      <div className="flex-1 flex max-w-7xl w-full mx-auto pb-16 md:pb-0">
        <Sidebar currentCase={caseData} />
        <main className="flex-1 p-3 sm:p-6 lg:p-8 min-w-0 max-w-full overflow-x-hidden page-smooth-enter">
          {children}
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
};

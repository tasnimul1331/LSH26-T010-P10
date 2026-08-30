"use client";

import React from "react";
import { useCase } from "@/components/context/CaseContext";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { Loader2, AlertCircle } from "lucide-react";

export const ShellLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { caseData, availableCases, setCurrentCaseId, tariff, isLoading, error } = useCase();

  if (isLoading || !caseData || !tariff) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF9F6] p-4 sm:p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-stone-900 text-[#C5A059] flex items-center justify-center shadow-lg animate-bounce mb-4">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
        <h2 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight">Loading METERLY Engine...</h2>
        <p className="text-xs text-stone-500 mt-1 max-w-sm">
          Ingesting public cases and compiling authoritative Bangladesh BERC tariff specifications...
        </p>
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
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] max-w-full overflow-x-hidden">
      <Navbar
        currentCase={caseData}
        availableCases={availableCases}
        onSelectCase={setCurrentCaseId}
        tariff={tariff}
      />
      <div className="flex-1 flex max-w-7xl w-full mx-auto pb-16 md:pb-0">
        <Sidebar currentCase={caseData} />
        <main className="flex-1 p-3 sm:p-6 lg:p-8 min-w-0 max-w-full overflow-x-hidden">
          {children}
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
};

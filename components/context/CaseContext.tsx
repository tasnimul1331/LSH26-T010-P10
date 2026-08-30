"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { CaseData, TariffConfig, SimulationResult, DepletionForecast, TargetRechargeResult, ComparisonResult } from "@/types";
import { simulateMeter } from "@/lib/engine/meter-engine";
import { calculateDepletionForecast, calculateTargetRecharge } from "@/lib/engine/advisor-engine";
import { compareRechargeStrategies } from "@/lib/engine/comparison-engine";

interface CaseContextType {
  currentCaseId: string;
  setCurrentCaseId: (id: string) => void;
  caseData: CaseData | null;
  tariff: TariffConfig | null;
  simulation: SimulationResult | null;
  depletion: DepletionForecast | null;
  targetRecharge: TargetRechargeResult | null;
  comparison: ComparisonResult | null;
  availableCases: any[];
  isLoading: boolean;
  error: string | null;
  refreshData: () => void;
  updateTargetScenario: (targetDate: string, dailyUnits: number) => void;
}

const CaseContext = createContext<CaseContextType | undefined>(undefined);

export const CaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentCaseId, setCurrentCaseId] = useState<string>("PUB-01");
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [tariff, setTariff] = useState<TariffConfig | null>(null);
  const [availableCases, setAvailableCases] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Custom Target Scenario overrides
  const [targetDateOverride, setTargetDateOverride] = useState<string | undefined>();
  const [dailyUnitsOverride, setDailyUnitsOverride] = useState<number | undefined>();

  // Fetch tariff and cases list
  useEffect(() => {
    async function init() {
      try {
        setIsLoading(true);
        // Load tariff
        const tariffRes = await fetch("/api/tariff");
        const tariffJson = await tariffRes.json();
        if (tariffJson.success) {
          setTariff(tariffJson.tariff);
        }

        // Load cases summaries
        const casesRes = await fetch("/api/cases");
        const casesJson = await casesRes.json();
        if (casesJson.success) {
          setAvailableCases(casesJson.cases);
        }
      } catch (err: any) {
        console.error("Init failed:", err);
        setError(err.message || "Failed to initialize application");
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  // Fetch current case data
  useEffect(() => {
    async function fetchCase() {
      if (!currentCaseId) return;
      try {
        const res = await fetch(`/api/cases/${currentCaseId}`);
        const json = await res.json();
        if (json.success) {
          setCaseData(json.case);
          setTargetDateOverride(json.case.target_date);
          setDailyUnitsOverride(json.case.usual_daily_units);
        } else {
          setError(json.error);
        }
      } catch (err: any) {
        setError(err.message);
      }
    }
    fetchCase();
  }, [currentCaseId]);

  // Deterministic calculation results
  const simulation = React.useMemo(() => {
    if (!caseData || !tariff || !tariff.is_configured) return null;
    return simulateMeter(caseData, tariff);
  }, [caseData, tariff]);

  const depletion = React.useMemo(() => {
    if (!caseData || !tariff || !tariff.is_configured) return null;
    return calculateDepletionForecast(caseData, tariff, dailyUnitsOverride);
  }, [caseData, tariff, dailyUnitsOverride]);

  const targetRecharge = React.useMemo(() => {
    if (!caseData || !tariff || !tariff.is_configured) return null;
    return calculateTargetRecharge(
      caseData,
      tariff,
      targetDateOverride,
      dailyUnitsOverride
    );
  }, [caseData, tariff, targetDateOverride, dailyUnitsOverride]);

  const comparison = React.useMemo(() => {
    if (!caseData || !tariff || !tariff.is_configured) return null;
    return compareRechargeStrategies(caseData, tariff);
  }, [caseData, tariff]);

  const updateTargetScenario = (targetDate: string, dailyUnits: number) => {
    setTargetDateOverride(targetDate);
    setDailyUnitsOverride(dailyUnits);
  };

  const refreshData = async () => {
    if (currentCaseId) {
      const res = await fetch(`/api/cases/${currentCaseId}`);
      const json = await res.json();
      if (json.success) setCaseData(json.case);
    }
    const casesRes = await fetch("/api/cases");
    const casesJson = await casesRes.json();
    if (casesJson.success) {
      setAvailableCases(casesJson.cases);
    }
    const tariffRes = await fetch("/api/tariff");
    const tariffJson = await tariffRes.json();
    if (tariffJson.success) setTariff(tariffJson.tariff);
  };

  return (
    <CaseContext.Provider
      value={{
        currentCaseId,
        setCurrentCaseId,
        caseData,
        tariff,
        simulation,
        depletion,
        targetRecharge,
        comparison,
        availableCases,
        isLoading,
        error,
        refreshData,
        updateTargetScenario,
      }}
    >
      {children}
    </CaseContext.Provider>
  );
};

export const useCase = () => {
  const context = useContext(CaseContext);
  if (!context) {
    throw new Error("useCase must be used within a CaseProvider");
  }
  return context;
};

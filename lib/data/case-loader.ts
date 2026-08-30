import fs from "fs";
import path from "path";
import { CaseData, ValidationReport } from "@/types";
import { PublicCasesFileSchema, validateCaseIntegrity } from "../validation/case-schema";

interface CaseSummary {
  case_id: string;
  opening_balance_bdt: string;
  total_days: number;
  start_date: string;
  end_date: string;
  total_units: number;
  total_recharges: number;
  today: string;
  target_date: string;
  usual_daily_units: number;
  comparison_months: string[];
}

let cachedCases: Map<string, CaseData> | null = null;
let cachedSummaries: CaseSummary[] | null = null;
const customCasesMap = new Map<string, CaseData>();

export function loadAllCases(): { cases: Map<string, CaseData>; summaries: CaseSummary[] } {
  if (cachedCases && cachedSummaries) {
    // Merge with custom cases
    const mergedCases = new Map(cachedCases);
    for (const [id, c] of customCasesMap.entries()) {
      mergedCases.set(id, c);
    }
    return { cases: mergedCases, summaries: cachedSummaries };
  }

  const casesMap = new Map<string, CaseData>();
  const summaries: CaseSummary[] = [];

  try {
    const jsonPath = path.join(
      process.cwd(),
      "public",
      "cases",
      "P10_prepaid_meter_public.json"
    );

    let raw = "";
    if (fs.existsSync(jsonPath)) {
      raw = fs.readFileSync(jsonPath, "utf8");
    } else {
      const fallbackPath = path.join(process.cwd(), "P10_prepaid_meter_public.json");
      raw = fs.readFileSync(fallbackPath, "utf8");
    }

    const parsed = JSON.parse(raw);
    const validated = PublicCasesFileSchema.parse(parsed);

    for (const c of validated.cases) {
      const typedCase = c as CaseData;
      casesMap.set(typedCase.case_id, typedCase);

      const totalUnits = typedCase.days.reduce((sum, d) => sum + d.units, 0);
      summaries.push({
        case_id: typedCase.case_id,
        opening_balance_bdt: typedCase.opening_balance_bdt,
        total_days: typedCase.days.length,
        start_date: typedCase.days[0]?.date || "",
        end_date: typedCase.days[typedCase.days.length - 1]?.date || "",
        total_units: totalUnits,
        total_recharges: typedCase.recharges.length,
        today: typedCase.today,
        target_date: typedCase.target_date,
        usual_daily_units: typedCase.usual_daily_units,
        comparison_months: typedCase.comparison.months,
      });
    }

    cachedCases = casesMap;
    cachedSummaries = summaries;

    return { cases: casesMap, summaries };
  } catch (err) {
    console.error("Failed to load cases file:", err);
    throw err;
  }
}

export function getCaseById(caseId: string): { caseData: CaseData; validation: ValidationReport } | null {
  const { cases } = loadAllCases();
  const c = cases.get(caseId);
  if (!c) return null;

  const validation = validateCaseIntegrity(c);
  return { caseData: c, validation };
}

export function registerCustomCase(c: CaseData): ValidationReport {
  const validation = validateCaseIntegrity(c);
  if (validation.is_valid) {
    customCasesMap.set(c.case_id, c);
    if (cachedSummaries) {
      const totalUnits = c.days.reduce((sum, d) => sum + d.units, 0);
      const existingIdx = cachedSummaries.findIndex((s) => s.case_id === c.case_id);
      const newSummary: CaseSummary = {
        case_id: c.case_id,
        opening_balance_bdt: c.opening_balance_bdt,
        total_days: c.days.length,
        start_date: c.days[0]?.date || "",
        end_date: c.days[c.days.length - 1]?.date || "",
        total_units: totalUnits,
        total_recharges: c.recharges ? c.recharges.length : 0,
        today: c.today,
        target_date: c.target_date,
        usual_daily_units: c.usual_daily_units,
        comparison_months: c.comparison?.months || [],
      };
      if (existingIdx >= 0) {
        cachedSummaries[existingIdx] = newSummary;
      } else {
        cachedSummaries.push(newSummary);
      }
    }
  }
  return validation;
}

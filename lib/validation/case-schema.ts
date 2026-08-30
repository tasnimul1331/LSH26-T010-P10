import { z } from "zod";
import { isFirstDayOfMonth, addDays, getMonthKey } from "../utils/dates";
import { CaseData, ValidationReport } from "@/types";

export const DailyReadingSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  units: z.number().int().nonnegative(),
});

export const RechargeEventSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  amount_bdt: z.string().regex(/^\d+(\.\d{1,2})?$/),
});

export const ComparisonConfigSchema = z.object({
  months: z.array(z.string().regex(/^\d{4}-\d{2}$/)).length(3),
  source: z.string(),
  daily_units: z.number().nullable().optional(),
  opening_balance_bdt: z.string().regex(/^\d+(\.\d{1,2})?$/),
  low_threshold_bdt: z.string().regex(/^\d+(\.\d{1,2})?$/),
  low_amount_bdt: z.string().regex(/^\d+(\.\d{1,2})?$/),
  monthly_amount_bdt: z.string().regex(/^\d+(\.\d{1,2})?$/),
});

export const CaseDataSchema = z.object({
  case_id: z.string().min(1),
  opening_balance_bdt: z.string().regex(/^\d+(\.\d{1,2})?$/),
  days: z.array(DailyReadingSchema).min(1),
  recharges: z.array(RechargeEventSchema),
  today: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  usual_daily_units: z.number().int().positive(),
  target_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  comparison: ComparisonConfigSchema,
});

export const PublicCasesFileSchema = z.object({
  schema_version: z.string(),
  problem_id: z.string(),
  format_note: z.string().optional(),
  cases: z.array(CaseDataSchema).min(1),
});

/**
 * Perform comprehensive deep integrity verification on a case according to PRD FR-01.
 */
export function validateCaseIntegrity(c: CaseData): ValidationReport {
  const checks: ValidationReport["checks"] = [];
  const warnings: string[] = [];
  const errors: string[] = [];

  // Check 1: Days array length
  const hasDays = c.days && c.days.length > 0;
  checks.push({
    name: "Has Daily Readings",
    passed: hasDays,
    message: hasDays ? `Found ${c.days.length} daily readings.` : "No daily readings found.",
  });
  if (!hasDays) errors.push("Case has no daily readings.");

  if (hasDays) {
    // Check 2: First day is 1st of month
    const firstDate = c.days[0].date;
    const startsOnFirst = isFirstDayOfMonth(firstDate);
    checks.push({
      name: "Starts on 1st of Month",
      passed: startsOnFirst,
      message: startsOnFirst
        ? `Readings start on calendar first day: ${firstDate}`
        : `Readings start on ${firstDate}, expected day 01.`,
    });
    if (!startsOnFirst) errors.push(`Readings start on ${firstDate} instead of day 01.`);

    // Check 3: Consecutive dates
    let isConsecutive = true;
    for (let i = 1; i < c.days.length; i++) {
      const expected = addDays(c.days[i - 1].date, 1);
      if (c.days[i].date !== expected) {
        isConsecutive = false;
        errors.push(`Date gap detected between ${c.days[i - 1].date} and ${c.days[i].date} (expected ${expected}).`);
        break;
      }
    }
    checks.push({
      name: "Consecutive Daily Dates",
      passed: isConsecutive,
      message: isConsecutive ? "All daily readings are strictly consecutive." : "Date gap found in daily sequence.",
    });

    // Check 4: Today equals last date
    const lastDate = c.days[c.days.length - 1].date;
    const todayMatches = c.today === lastDate;
    checks.push({
      name: "Today Matches Last Reading",
      passed: todayMatches,
      message: todayMatches
        ? `Case 'today' (${c.today}) matches the final reading date.`
        : `Case 'today' is ${c.today} but last reading is ${lastDate}.`,
    });
    if (!todayMatches) errors.push(`Today (${c.today}) does not match last reading (${lastDate}).`);
  }

  // Check 5: Target date is after today
  const targetAfterToday = c.target_date > c.today;
  checks.push({
    name: "Target Date Ahead of Today",
    passed: targetAfterToday,
    message: targetAfterToday
      ? `Target date ${c.target_date} is future relative to ${c.today}.`
      : `Target date ${c.target_date} is not after ${c.today}.`,
  });
  if (!targetAfterToday) warnings.push(`Target date ${c.target_date} is not ahead of ${c.today}.`);

  // Check 6: Comparison months coverage
  const availableMonths = new Set(c.days.map((d) => getMonthKey(d.date)));
  const allComparisonMonthsCovered = c.comparison.months.every((m) => availableMonths.has(m));
  checks.push({
    name: "Comparison Months Present",
    passed: allComparisonMonthsCovered,
    message: allComparisonMonthsCovered
      ? `Comparison months [${c.comparison.months.join(", ")}] are fully recorded.`
      : `Some comparison months are missing from recorded readings.`,
  });
  if (!allComparisonMonthsCovered) {
    errors.push(`Comparison months [${c.comparison.months.join(", ")}] are not fully in recorded days.`);
  }

  return {
    is_valid: errors.length === 0,
    case_id: c.case_id,
    checks,
    warnings,
    errors,
  };
}

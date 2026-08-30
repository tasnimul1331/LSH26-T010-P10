/**
 * Date utility functions for calendar month tracking, sequence verification,
 * and future projection intervals.
 */

export function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function formatDateISO(d: Date): string {
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getMonthKey(dateStr: string): string {
  return dateStr.substring(0, 7); // "YYYY-MM"
}

export function isFirstDayOfMonth(dateStr: string): boolean {
  return dateStr.endsWith("-01");
}

export function addDays(dateStr: string, days: number): string {
  const d = parseDate(dateStr);
  d.setUTCDate(d.getUTCDate() + days);
  return formatDateISO(d);
}

export function daysBetween(startStr: string, endStr: string): number {
  const start = parseDate(startStr);
  const end = parseDate(endStr);
  const diffTime = end.getTime() - start.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

export function generateDateRange(startStr: string, endStr: string): string[] {
  const dates: string[] = [];
  let current = startStr;
  while (current <= endStr) {
    dates.push(current);
    current = addDays(current, 1);
  }
  return dates;
}

export function formatDisplayDate(dateStr: string): string {
  try {
    const d = parseDate(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    });
  } catch {
    return dateStr;
  }
}

export function formatMonthName(monthStr: string): string {
  try {
    const [year, month] = monthStr.split("-").map(Number);
    const d = new Date(Date.UTC(year, month - 1, 1));
    return d.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
  } catch {
    return monthStr;
  }
}

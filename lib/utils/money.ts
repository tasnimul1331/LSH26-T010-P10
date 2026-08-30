/**
 * Exact Money Arithmetic Engine for BDT Currency
 * Uses integer cents (paisa: 1 BDT = 100 paisa) to avoid IEEE-754 binary floating-point drift.
 */

export class Money {
  private readonly cents: number; // Stored as exact integer cents

  constructor(cents: number) {
    this.cents = Math.round(cents);
  }

  static fromBDT(bdt: number | string): Money {
    if (typeof bdt === "string") {
      const parsed = parseFloat(bdt.trim().replace(/,/g, ""));
      return new Money(Math.round(parsed * 100));
    }
    return new Money(Math.round(bdt * 100));
  }

  static fromCents(cents: number): Money {
    return new Money(cents);
  }

  static zero(): Money {
    return new Money(0);
  }

  getCents(): number {
    return this.cents;
  }

  toBDT(): number {
    return this.cents / 100;
  }

  toFixed(decimals = 2): string {
    return (this.cents / 100).toFixed(decimals);
  }

  add(other: Money | number | string): Money {
    const o = other instanceof Money ? other : Money.fromBDT(other);
    return new Money(this.cents + o.cents);
  }

  subtract(other: Money | number | string): Money {
    const o = other instanceof Money ? other : Money.fromBDT(other);
    return new Money(this.cents - o.cents);
  }

  multiply(factor: number): Money {
    return new Money(Math.round(this.cents * factor));
  }

  divide(divisor: number): Money {
    if (divisor === 0) throw new Error("Division by zero in Money engine");
    return new Money(Math.round(this.cents / divisor));
  }

  isZero(): boolean {
    return this.cents === 0;
  }

  isPositive(): boolean {
    return this.cents > 0;
  }

  isNegative(): boolean {
    return this.cents < 0;
  }

  equals(other: Money): boolean {
    return this.cents === other.cents;
  }

  greaterThan(other: Money): boolean {
    return this.cents > other.cents;
  }

  lessThan(other: Money): boolean {
    return this.cents < other.cents;
  }

  clampMinZero(): Money {
    return new Money(Math.max(0, this.cents));
  }

  format(currency = "BDT"): string {
    return `${currency} ${(this.cents / 100).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
}

/**
 * Round a raw BDT amount to standard 2 decimal places using half-up convention.
 */
export function roundBDT(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/**
 * Format a numeric BDT amount into a formatted currency string.
 */
export function formatBDT(amount: number | string | null | undefined, includeSymbol = true): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return includeSymbol ? "BDT 0.00" : "0.00";
  }
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  const formatted = num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return includeSymbol ? `BDT ${formatted}` : formatted;
}

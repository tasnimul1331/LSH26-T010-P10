import fs from "fs";
import path from "path";
import { TariffConfig } from "@/types";
import { TariffConfigSchema } from "../validation/tariff-schema";

let cachedTariff: TariffConfig | null = null;
let customTariffOverride: TariffConfig | null = null;
let isUnavailableMode = false;

export function loadTariffConfig(): TariffConfig {
  if (isUnavailableMode) {
    return {
      tariff_version: "unavailable",
      effective_date: "",
      name: "Tariff Configuration Unavailable",
      description: "No authoritative tariff has been configured.",
      currency: "BDT",
      slabs: [],
      demand_charge_bdt_per_kw_month: 0,
      meter_rent_bdt_per_month: 0,
      sanctioned_load_kw_default: 1,
      vat_percentage: 0,
      fixed_charge_application: "first_recharge_of_month",
      base_slab_rate_for_breakdown: 5.26,
      rounding_precision_decimals: 2,
      is_configured: false,
    };
  }

  if (customTariffOverride) {
    return customTariffOverride;
  }

  if (cachedTariff) {
    return cachedTariff;
  }

  try {
    const tariffPath = path.join(process.cwd(), "config", "tariff.v1.json");
    if (!fs.existsSync(tariffPath)) {
      throw new Error(`Tariff file not found at ${tariffPath}`);
    }
    const raw = fs.readFileSync(tariffPath, "utf8");
    const json = JSON.parse(raw);
    const validated = TariffConfigSchema.parse(json);
    cachedTariff = validated as TariffConfig;
    return cachedTariff;
  } catch (err) {
    console.error("Failed to load tariff config:", err);
    throw err;
  }
}

export function setCustomTariff(tariff: TariffConfig | null): void {
  customTariffOverride = tariff;
}

export function setTariffUnavailableMode(unavailable: boolean): void {
  isUnavailableMode = unavailable;
}

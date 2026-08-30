import { z } from "zod";

export const TariffSlabSchema = z.object({
  slab_id: z.string(),
  name: z.string(),
  min_units: z.number().nonnegative(),
  max_units: z.number().positive().nullable(),
  rate_per_unit_bdt: z.number().positive(),
});

export const TariffConfigSchema = z.object({
  tariff_version: z.string().min(1),
  effective_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  name: z.string().min(1),
  description: z.string(),
  currency: z.literal("BDT"),
  slabs: z.array(TariffSlabSchema).min(1),
  demand_charge_bdt_per_kw_month: z.number().nonnegative(),
  meter_rent_bdt_per_month: z.number().nonnegative(),
  sanctioned_load_kw_default: z.number().positive(),
  vat_percentage: z.number().nonnegative(),
  fixed_charge_application: z.enum(["first_recharge_of_month", "first_day_of_month"]),
  base_slab_rate_for_breakdown: z.number().positive(),
  rounding_precision_decimals: z.number().int().min(0).max(4),
  is_configured: z.boolean(),
});

export type ValidatedTariffConfig = z.infer<typeof TariffConfigSchema>;

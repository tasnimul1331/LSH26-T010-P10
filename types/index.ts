export interface DailyReading {
  date: string; // YYYY-MM-DD
  units: number; // integer kWh
}

export interface RechargeEvent {
  date: string; // YYYY-MM-DD
  amount_bdt: string; // decimal string e.g. "300.00"
}

export interface ComparisonConfig {
  months: string[]; // e.g. ["2026-04", "2026-05", "2026-06"]
  source: string; // "readings"
  daily_units: number | null;
  opening_balance_bdt: string;
  low_threshold_bdt: string;
  low_amount_bdt: string;
  monthly_amount_bdt: string;
}

export interface CaseData {
  case_id: string;
  opening_balance_bdt: string;
  days: DailyReading[];
  recharges: RechargeEvent[];
  today: string; // YYYY-MM-DD
  usual_daily_units: number;
  target_date: string; // YYYY-MM-DD
  comparison: ComparisonConfig;
}

export interface TariffSlab {
  slab_id: string;
  name: string;
  min_units: number;
  max_units: number | null; // null for highest slab (e.g. >600)
  rate_per_unit_bdt: number;
}

export interface TariffConfig {
  tariff_version: string;
  effective_date: string;
  name: string;
  description: string;
  currency: string;
  slabs: TariffSlab[];
  demand_charge_bdt_per_kw_month: number;
  meter_rent_bdt_per_month: number;
  sanctioned_load_kw_default: number;
  vat_percentage: number;
  fixed_charge_application: "first_recharge_of_month" | "first_day_of_month";
  base_slab_rate_for_breakdown: number;
  rounding_precision_decimals: number;
  is_configured: boolean;
}

export interface SlabSlice {
  slab_id: string;
  slab_name: string;
  units: number;
  rate: number;
  cost_bdt: number;
}

export interface DailyLedgerRow {
  date: string;
  units: number;
  month: string; // YYYY-MM
  day_of_month: number;
  monthly_running_units_before: number;
  monthly_running_units_after: number;
  slab_slices: SlabSlice[];
  energy_cost_bdt: number;
  recharge_amount_bdt: number;
  is_first_recharge_of_month: boolean;
  demand_charge_bdt: number;
  meter_rent_bdt: number;
  fixed_charges_bdt: number;
  vat_bdt: number;
  total_meter_cost_bdt: number;
  opening_balance_bdt: number;
  closing_balance_bdt: number;
  cumulative_energy_cost_bdt: number;
  cumulative_fixed_charge_bdt: number;
  cumulative_vat_bdt: number;
  cumulative_total_cost_bdt: number;
  cumulative_recharge_bdt: number;
}

export interface SimulationResult {
  case_id: string;
  tariff_version: string;
  opening_balance_bdt: number;
  current_balance_bdt: number;
  today: string;
  total_days: number;
  total_units: number;
  total_recharges_bdt: number;
  total_energy_cost_bdt: number;
  total_fixed_charges_bdt: number;
  total_vat_bdt: number;
  total_meter_cost_bdt: number;
  ledger: DailyLedgerRow[];
  monthly_summaries: MonthlySummary[];
}

export interface MonthlySummary {
  month: string;
  total_units: number;
  recharge_count: number;
  total_recharges_bdt: number;
  energy_cost_bdt: number;
  fixed_charges_bdt: number;
  vat_bdt: number;
  total_cost_bdt: number;
  closing_balance_bdt: number;
}

export interface CostDecomposition {
  energy_cost_base_bdt: number;
  higher_slab_effect_bdt: number;
  fixed_charges_bdt: number;
  vat_bdt: number;
  total_projected_cost_bdt: number;
  base_rate: number;
  total_units: number;
  formula_notes: string[];
}

export interface DepletionForecast {
  current_balance_bdt: number;
  current_date: string;
  usual_daily_units: number;
  depletion_date: string | null; // null if balance never exhausts within horizon
  days_remaining: number;
  depletion_day_shortfall_bdt: number;
  daily_forecast: ForecastDayRow[];
}

export interface ForecastDayRow {
  date: string;
  units: number;
  energy_cost_bdt: number;
  fixed_charges_bdt: number;
  vat_bdt: number;
  total_cost_bdt: number;
  closing_balance_bdt: number;
  is_depleted: boolean;
}

export interface TargetRechargeResult {
  case_id: string;
  current_date: string;
  target_date: string;
  days_ahead: number;
  usual_daily_units: number;
  current_balance_bdt: number;
  projected_total_cost_bdt: number;
  required_recharge_bdt: number;
  breakdown: CostDecomposition;
  assumptions: {
    tariff_version: string;
    no_interim_recharges_assumed: boolean;
    constant_daily_usage: number;
    sanctioned_load_kw: number;
  };
}

export interface StrategySimulationDay {
  date: string;
  units: number;
  recharge_amount_bdt: number;
  energy_cost_bdt: number;
  fixed_charges_bdt: number;
  vat_bdt: number;
  total_cost_bdt: number;
  closing_balance_bdt: number;
  monthly_running_units: number;
  recharge_triggered: boolean;
}

export interface StrategyResult {
  strategy_id: "low_balance" | "monthly";
  name: string;
  description: string;
  opening_balance_bdt: number;
  closing_balance_bdt: number;
  total_units: number;
  total_recharges_count: number;
  total_recharged_amount_bdt: number;
  total_energy_cost_bdt: number;
  total_fixed_charges_bdt: number;
  total_vat_bdt: number;
  total_meter_cost_bdt: number; // Meter consumed cost = energy + fixed + vat
  timeline: StrategySimulationDay[];
}

export interface ComparisonResult {
  case_id: string;
  tariff_version: string;
  comparison_months: string[];
  total_units_consumed: number;
  low_balance_strategy: StrategyResult;
  monthly_strategy: StrategyResult;
  cost_difference_bdt: number; // positive means low_balance cost > monthly cost, negative means lower
  is_tie: boolean;
  cheaper_strategy: "low_balance" | "monthly" | "equal";
  verdict_message: string;
  fixed_charges_difference_bdt: number;
  vat_difference_bdt: number;
  energy_cost_difference_bdt: number; // MUST BE 0.00 INVARIANT!
  invariant_check_passed: boolean;
  explanation: string;
}

export interface ValidationReport {
  is_valid: boolean;
  case_id: string;
  checks: {
    name: string;
    passed: boolean;
    message: string;
  }[];
  warnings: string[];
  errors: string[];
}

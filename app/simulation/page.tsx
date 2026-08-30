"use client";

import React, { useState, useMemo } from "react";
import { useCase } from "@/components/context/CaseContext";
import { BalanceTimelineChart } from "@/components/charts/BalanceTimelineChart";
import { DailyUsageSlabChart } from "@/components/charts/DailyUsageSlabChart";
import { BillPrintModal } from "@/components/billing/BillPrintModal";
import { formatBDT } from "@/lib/utils/money";
import { formatDisplayDate } from "@/lib/utils/dates";
import {
  Download,
  Filter,
  Search,
  ArrowUpCircle,
  ArrowDownCircle,
  Zap,
  DollarSign,
  FileText,
  HelpCircle,
  Printer,
} from "lucide-react";

export default function SimulationPage() {
  const { caseData, simulation, tariff, targetRecharge } = useCase();
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [rechargesOnly, setRechargesOnly] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const rowsPerPage = 25;

  if (!caseData || !simulation || !tariff || !targetRecharge) return null;

  const availableMonths = useMemo(() => {
    return Array.from(new Set(simulation.ledger.map((d) => d.month)));
  }, [simulation]);

  const filteredLedger = useMemo(() => {
    return simulation.ledger.filter((row) => {
      if (selectedMonth !== "all" && row.month !== selectedMonth) return false;
      if (rechargesOnly && row.recharge_amount_bdt <= 0) return false;
      if (searchTerm && !row.date.includes(searchTerm)) return false;
      return true;
    });
  }, [simulation, selectedMonth, rechargesOnly, searchTerm]);

  const totalPages = Math.ceil(filteredLedger.length / rowsPerPage) || 1;
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filteredLedger.slice(start, start + rowsPerPage);
  }, [filteredLedger, page]);

  const exportCSV = () => {
    const headers = [
      "Date",
      "Month",
      "Units (kWh)",
      "Monthly Running Units",
      "Energy Cost (BDT)",
      "Recharge Deposit (BDT)",
      "Is First Recharge of Month",
      "Fixed Charges (BDT)",
      "VAT 5% (BDT)",
      "Total Meter Cost (BDT)",
      "Opening Balance (BDT)",
      "Closing Balance (BDT)",
    ];
    const rows = simulation.ledger.map((r) => [
      r.date,
      r.month,
      r.units,
      r.monthly_running_units_after,
      r.energy_cost_bdt.toFixed(2),
      r.recharge_amount_bdt.toFixed(2),
      r.is_first_recharge_of_month ? "YES" : "NO",
      r.fixed_charges_bdt.toFixed(2),
      r.vat_bdt.toFixed(2),
      r.total_meter_cost_bdt.toFixed(2),
      r.opening_balance_bdt.toFixed(2),
      r.closing_balance_bdt.toFixed(2),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `meterly_simulation_${caseData.case_id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">
              Prepaid Meter Daily Ledger
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#C5A059]/15 text-[#8A6A24] border border-[#C5A059]/30">
              Daily Ledger
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Complete chronological audit ledger reconstructed from tariff slab pricing and recharge deposits
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 text-xs font-semibold text-stone-700 shadow-2xs transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Print Bill PDF</span>
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 text-xs font-semibold text-stone-700 shadow-2xs transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Reconstructed Total Financial Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="luxury-card p-4">
          <span className="text-[10px] font-bold text-stone-400 uppercase">Opening Balance</span>
          <div className="text-base font-extrabold font-mono text-stone-900 mt-1">
            {formatBDT(simulation.opening_balance_bdt)}
          </div>
        </div>

        <div className="luxury-card p-4">
          <span className="text-[10px] font-bold text-emerald-600 uppercase">Total Recharges</span>
          <div className="text-base font-extrabold font-mono text-emerald-700 mt-1">
            +{formatBDT(simulation.total_recharges_bdt)}
          </div>
        </div>

        <div className="luxury-card p-4">
          <span className="text-[10px] font-bold text-blue-600 uppercase">Total Energy Cost</span>
          <div className="text-base font-extrabold font-mono text-blue-700 mt-1">
            -{formatBDT(simulation.total_energy_cost_bdt)}
          </div>
        </div>

        <div className="luxury-card p-4">
          <span className="text-[10px] font-bold text-amber-600 uppercase">Fixed Charges</span>
          <div className="text-base font-extrabold font-mono text-amber-700 mt-1">
            -{formatBDT(simulation.total_fixed_charges_bdt)}
          </div>
        </div>

        <div className="luxury-card p-4">
          <span className="text-[10px] font-bold text-purple-600 uppercase">Total VAT (5%)</span>
          <div className="text-base font-extrabold font-mono text-purple-700 mt-1">
            -{formatBDT(simulation.total_vat_bdt)}
          </div>
        </div>

        <div className="luxury-card luxury-card-gold p-4">
          <span className="text-[10px] font-bold text-[#8A6A24] uppercase">Current Balance</span>
          <div className="text-base font-extrabold font-mono text-[#8A6A24] mt-1">
            {formatBDT(simulation.current_balance_bdt)}
          </div>
        </div>
      </div>

      {/* Visual Charts */}
      <BalanceTimelineChart
        ledger={simulation.ledger}
        openingBalanceBDT={simulation.opening_balance_bdt}
      />

      <DailyUsageSlabChart ledger={simulation.ledger} />

      {/* Audit Ledger Table Section */}
      <div className="luxury-card p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-stone-900">Historical Daily Transaction Ledger</h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Auditing all {filteredLedger.length} days with exact multi-slab allocations and BDT balances
            </p>
          </div>

          {/* Table Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search YYYY-MM-DD"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="w-full sm:w-auto pl-8 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-mono text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#C5A059]/40"
              />
            </div>

            {/* Month Filter */}
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-medium text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#C5A059]/40"
            >
              <option value="all">All Months</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            {/* Recharges Only Toggle */}
            <button
              onClick={() => {
                setRechargesOnly(!rechargesOnly);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                rechargesOnly
                  ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold"
                  : "bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100"
              }`}
            >
              Recharges Only
            </button>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto border border-stone-200 rounded-xl">
          <table className="w-full text-xs text-left border-collapse min-w-[720px]">
            <thead className="bg-stone-50/80 border-b border-stone-200 text-stone-600 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3 text-center">Daily Units</th>
                <th className="p-3 text-center">Month Running</th>
                <th className="p-3 text-right">Energy Cost</th>
                <th className="p-3 text-right">Recharge Deposit</th>
                <th className="p-3 text-right">Fixed Charges</th>
                <th className="p-3 text-right">VAT (5%)</th>
                <th className="p-3 text-right">Daily Meter Cost</th>
                <th className="p-3 text-right">Closing Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-tabular">
              {paginatedRows.map((row) => {
                const hasRecharge = row.recharge_amount_bdt > 0;
                return (
                  <tr
                    key={row.date}
                    className={`hover:bg-stone-50/60 transition-colors ${
                      hasRecharge ? "bg-emerald-50/30" : ""
                    }`}
                  >
                    <td className="p-3 font-mono font-medium text-stone-900">
                      {row.date}
                    </td>
                    <td className="p-3 text-center font-mono text-stone-700">
                      {row.units} kWh
                    </td>
                    <td className="p-3 text-center font-mono text-stone-500">
                      {row.monthly_running_units_after} kWh
                    </td>
                    <td className="p-3 text-right font-mono text-stone-800">
                      {formatBDT(row.energy_cost_bdt, false)}
                    </td>
                    <td className="p-3 text-right font-mono">
                      {hasRecharge ? (
                        <span className="font-bold text-emerald-600 bg-emerald-100/60 px-1.5 py-0.5 rounded">
                          +{formatBDT(row.recharge_amount_bdt, false)}
                        </span>
                      ) : (
                        <span className="text-stone-300">-</span>
                      )}
                    </td>
                    <td className="p-3 text-right font-mono">
                      {row.fixed_charges_bdt > 0 ? (
                        <span className="font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                          {formatBDT(row.fixed_charges_bdt, false)}
                        </span>
                      ) : (
                        <span className="text-stone-300">-</span>
                      )}
                    </td>
                    <td className="p-3 text-right font-mono text-stone-600">
                      {formatBDT(row.vat_bdt, false)}
                    </td>
                    <td className="p-3 text-right font-mono font-semibold text-rose-600">
                      -{formatBDT(row.total_meter_cost_bdt, false)}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-stone-900">
                      {formatBDT(row.closing_balance_bdt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="mt-4 flex items-center justify-between text-xs text-stone-500">
          <div>
            Showing {(page - 1) * rowsPerPage + 1} to{" "}
            {Math.min(page * rowsPerPage, filteredLedger.length)} of {filteredLedger.length} days
          </div>
          <div className="flex items-center gap-1">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1 bg-stone-100 border border-stone-200 rounded-lg text-xs font-semibold disabled:opacity-40 hover:bg-stone-200 transition-all"
            >
              Previous
            </button>
            <span className="px-2 font-mono">
              {page} / {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1 bg-stone-100 border border-stone-200 rounded-lg text-xs font-semibold disabled:opacity-40 hover:bg-stone-200 transition-all"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Official PDF Bill Print Modal */}
      <BillPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        caseData={caseData}
        tariff={tariff}
        simulation={simulation}
        targetRecharge={targetRecharge}
      />
    </div>
  );
}

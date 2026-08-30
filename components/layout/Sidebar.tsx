"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  LineChart,
  Lightbulb,
  Scale,
  Database,
  Settings,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { CaseData } from "@/types";
import { formatBDT } from "@/lib/utils/money";

interface SidebarProps {
  currentCase: CaseData;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentCase }) => {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/",
      label: "Overview",
      icon: LayoutDashboard,
      badge: "Dashboard",
    },
    {
      href: "/simulation",
      label: "Meter Simulation",
      icon: LineChart,
      badge: "Ledger",
    },
    {
      href: "/advisor",
      label: "Recharge Advisor",
      icon: Lightbulb,
      badge: "Forecast",
    },
    {
      href: "/comparison",
      label: "Habit Comparison",
      icon: Scale,
      badge: "Compare",
    },
    {
      href: "/case-data",
      label: "Case Data & Audit",
      icon: Database,
      badge: "Audit",
    },
    {
      href: "/tariff",
      label: "Tariff Config",
      icon: Settings,
      badge: "Tariff",
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-stone-200 flex flex-col justify-between p-4 min-h-[calc(100vh-4rem)] hidden md:flex">
      {/* Navigation Links */}
      <div className="space-y-1">
        <div className="px-3 py-2 text-[10px] font-bold text-stone-400 uppercase tracking-widest">
          NAVIGATION
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? "bg-stone-900 text-white shadow-xs"
                  : "text-stone-600 hover:bg-stone-100/80 hover:text-stone-900"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? "text-[#C5A059]" : "text-stone-400"
                  }`}
                />
                <span>{item.label}</span>
              </div>
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-medium ${
                  isActive
                    ? "bg-white/10 text-stone-300"
                    : "bg-stone-100 text-stone-500"
                }`}
              >
                {item.badge}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Household Telemetry Summary Card */}
      <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-stone-200 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
            ACTIVE CASE
          </span>
          <span className="font-mono font-bold text-xs text-stone-900">
            {currentCase.case_id}
          </span>
        </div>

        <div className="space-y-1.5 text-xs text-stone-600 font-tabular">
          <div className="flex justify-between">
            <span className="text-stone-400">Opening Balance:</span>
            <span className="font-mono">{formatBDT(currentCase.opening_balance_bdt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-400">Recorded Days:</span>
            <span className="font-mono">{currentCase.days.length} days</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-400">Usual Usage:</span>
            <span className="font-mono">{currentCase.usual_daily_units} kWh/d</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-400">Target Date:</span>
            <span className="font-mono">{currentCase.target_date}</span>
          </div>
        </div>

        <div className="pt-2 border-t border-stone-200/80 flex items-center gap-1.5 text-[11px] text-[#8A6A24] font-medium">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Calculation Locked</span>
        </div>
      </div>
    </aside>
  );
};

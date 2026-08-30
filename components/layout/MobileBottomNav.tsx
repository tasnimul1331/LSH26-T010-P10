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
} from "lucide-react";

export const MobileBottomNav: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/",
      label: "Overview",
      icon: LayoutDashboard,
    },
    {
      href: "/simulation",
      label: "Simulation",
      icon: LineChart,
    },
    {
      href: "/advisor",
      label: "Advisor",
      icon: Lightbulb,
    },
    {
      href: "/comparison",
      label: "Compare",
      icon: Scale,
    },
    {
      href: "/case-data",
      label: "Cases",
      icon: Database,
    },
    {
      href: "/tariff",
      label: "Tariff",
      icon: Settings,
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 shadow-lg px-2 py-1.5 flex items-center justify-around safe-area-bottom">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
              isActive
                ? "text-[#8A6A24] font-bold"
                : "text-stone-500 hover:text-stone-900"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                isActive
                  ? "bg-[#C5A059]/20 text-[#8A6A24]"
                  : "text-stone-500"
              }`}
            >
              <Icon className="w-4 h-4" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-medium">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
};

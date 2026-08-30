"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCase } from "@/components/context/CaseContext";
import {
  Search,
  LayoutDashboard,
  LineChart,
  Lightbulb,
  Scale,
  Database,
  Settings,
  Zap,
  X,
  Layers,
  Printer,
} from "lucide-react";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
}) => {
  const router = useRouter();
  const { availableCases, setCurrentCaseId } = useCase();
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Trigger open via custom event or direct state
          const event = new CustomEvent("toggle-command-palette");
          window.dispatchEvent(event);
        }
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const navActions = [
    {
      label: "Go to Overview Dashboard",
      icon: LayoutDashboard,
      action: () => {
        router.push("/");
        onClose();
      },
    },
    {
      label: "Go to Day-by-Day Simulation",
      icon: LineChart,
      action: () => {
        router.push("/simulation");
        onClose();
      },
    },
    {
      label: "Go to Recharge Advisor & Planner",
      icon: Lightbulb,
      action: () => {
        router.push("/advisor");
        onClose();
      },
    },
    {
      label: "Go to Strategy Comparison",
      icon: Scale,
      action: () => {
        router.push("/comparison");
        onClose();
      },
    },
    {
      label: "Go to Case Data & Validation",
      icon: Database,
      action: () => {
        router.push("/case-data");
        onClose();
      },
    },
    {
      label: "Go to Tariff Configuration Center",
      icon: Settings,
      action: () => {
        router.push("/tariff");
        onClose();
      },
    },
    {
      label: "Print PDF Bill Statement",
      icon: Printer,
      action: () => {
        onClose();
        setTimeout(() => window.print(), 200);
      },
    },
  ];

  const filteredNav = navActions.filter((a) =>
    a.label.toLowerCase().includes(query.toLowerCase())
  );

  const filteredCases = availableCases.filter((c) =>
    c.case_id.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm flex items-start justify-center pt-20 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Bar */}
        <div className="p-4 border-b border-stone-200 flex items-center gap-3">
          <Search className="w-5 h-5 text-[#C5A059]" />
          <input
            type="text"
            placeholder="Type a command, navigate, or switch case..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full text-sm font-medium text-stone-900 placeholder-stone-400 focus:outline-none"
          />
          <kbd className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-stone-100 border border-stone-200 text-stone-500 rounded">
            ESC
          </kbd>
        </div>

        {/* Action List */}
        <div className="max-h-96 overflow-y-auto p-3 space-y-4 text-xs">
          {/* Navigation Section */}
          {filteredNav.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-stone-400 uppercase px-2 mb-1 tracking-wider">
                NAVIGATION
              </div>
              <div className="space-y-0.5">
                {filteredNav.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={idx}
                      onClick={item.action}
                      className="w-full p-2.5 rounded-xl text-stone-700 hover:bg-stone-100 hover:text-stone-900 flex items-center justify-between transition-all"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 text-[#C5A059]" />
                        <span className="font-semibold">{item.label}</span>
                      </div>
                      <span className="text-[10px] text-stone-400 font-mono">Jump →</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Cases Section */}
          {filteredCases.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-stone-400 uppercase px-2 mb-1 tracking-wider">
                SWITCH HOUSEHOLD CASE ({filteredCases.length})
              </div>
              <div className="grid grid-cols-2 gap-1">
                {filteredCases.slice(0, 10).map((c) => (
                  <button
                    key={c.case_id}
                    onClick={() => {
                      setCurrentCaseId(c.case_id);
                      onClose();
                    }}
                    className="p-2 rounded-xl text-left border border-stone-100 hover:border-[#C5A059]/40 hover:bg-[#FAF9F6] transition-all"
                  >
                    <div className="font-mono font-bold text-stone-900">{c.case_id}</div>
                    <div className="text-[10px] text-stone-400">
                      {c.total_days} days • As of {c.today}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-stone-50 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
          <span>Navigate with arrows or search keyword</span>
          <span className="font-mono">METERLY OS</span>
        </div>
      </div>
    </div>
  );
};

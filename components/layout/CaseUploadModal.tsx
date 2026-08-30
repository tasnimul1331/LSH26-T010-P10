"use client";

import React, { useState } from "react";
import { X, UploadCloud, CheckCircle2, AlertCircle, FileJson, Loader2 } from "lucide-react";
import { CaseData } from "@/types";
import { validateCaseIntegrity } from "@/lib/validation/case-schema";
import { useCase } from "@/components/context/CaseContext";

interface CaseUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCaseSelected: (caseId: string) => void;
}

export const CaseUploadModal: React.FC<CaseUploadModalProps> = ({
  isOpen,
  onClose,
  onCaseSelected,
}) => {
  const [jsonText, setJsonText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { refreshData } = useCase();

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setJsonText(content);
      setError(null);
    };
    reader.readAsText(file);
  };

  const handleValidateAndRegister = async () => {
    setError(null);
    setSuccessMsg(null);

    try {
      if (!jsonText.trim()) {
        setError("Please paste or upload a valid JSON case.");
        return;
      }

      const parsed = JSON.parse(jsonText);
      // Support either single case or { cases: [...] } format
      const targetCase: CaseData = parsed.cases ? parsed.cases[0] : parsed;

      if (!targetCase || !targetCase.case_id) {
        setError("JSON does not contain a valid case with 'case_id'.");
        return;
      }

      // Fast client-side integrity validation
      const report = validateCaseIntegrity(targetCase);
      if (!report.is_valid) {
        setError(`Case validation failed: ${report.errors.join("; ")}`);
        return;
      }

      setIsSubmitting(true);

      // Register with backend server
      const res = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(targetCase),
      });

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        setError(resData.error || "Failed to register case with server.");
        setIsSubmitting(false);
        return;
      }

      setSuccessMsg(`Case '${targetCase.case_id}' successfully validated and loaded!`);
      await refreshData();
      setTimeout(() => {
        setIsSubmitting(false);
        onCaseSelected(targetCase.case_id);
        onClose();
      }, 1000);
    } catch (err: any) {
      setIsSubmitting(false);
      setError(`Invalid JSON syntax: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-base">Upload Challenge Case Data</h3>
              <p className="text-xs text-stone-500">
                Load custom JSON cases for instant verification against the deterministic engine
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* File input */}
          <div className="border-2 border-dashed border-stone-200 rounded-xl p-6 text-center hover:border-[#C5A059] transition-all bg-stone-50/50">
            <FileJson className="w-8 h-8 text-stone-400 mx-auto mb-2" />
            <label className="cursor-pointer text-xs font-semibold text-blue-600 hover:text-blue-700">
              <span>Choose a JSON File</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <p className="text-[11px] text-stone-400 mt-1">or paste JSON raw text below</p>
          </div>

          <div>
            <label className="text-xs font-semibold text-stone-700 block mb-1">
              Case JSON Definition
            </label>
            <textarea
              rows={8}
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder={`{\n  "case_id": "CUSTOM-01",\n  "opening_balance_bdt": "300.00",\n  "days": [...],\n  "recharges": [...],\n  "today": "2026-06-30",\n  "usual_daily_units": 10,\n  "target_date": "2026-07-25",\n  "comparison": { ... }\n}`}
              className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#C5A059]/40"
            />
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-stone-600 hover:bg-stone-200/60 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleValidateAndRegister}
            disabled={isSubmitting}
            className="px-5 py-2 rounded-lg bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{isSubmitting ? "Validating..." : "Validate & Load Case"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

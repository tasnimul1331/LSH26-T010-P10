import type { Metadata, Viewport } from "next";
import "./globals.css";
import { CaseProvider } from "@/components/context/CaseContext";
import { ShellLayout } from "@/components/layout/ShellLayout";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "METERLY — Prepaid Energy Intelligence | P10 Advisor",
  description:
    "Deterministic prepaid electricity meter simulation, depletion forecasting, target-date recharge advising, and 3-month habit comparison for Bangladesh BERC tariffs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased text-stone-900 bg-[#FAF9F6] selection:bg-[#C5A059]/30 selection:text-stone-900">
        <CaseProvider>
          <ShellLayout>{children}</ShellLayout>
        </CaseProvider>
      </body>
    </html>
  );
}

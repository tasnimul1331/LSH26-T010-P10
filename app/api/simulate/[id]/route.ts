import { NextRequest, NextResponse } from "next/server";
import { getCaseById } from "@/lib/data/case-loader";
import { loadTariffConfig } from "@/lib/data/tariff-loader";
import { simulateMeter } from "@/lib/engine/meter-engine";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const caseResult = getCaseById(id);
    if (!caseResult) {
      return NextResponse.json(
        { success: false, error: `Case '${id}' not found` },
        { status: 404 }
      );
    }

    const tariff = loadTariffConfig();
    if (!tariff.is_configured) {
      return NextResponse.json(
        {
          success: false,
          error: "Tariff configuration unavailable",
          is_tariff_unavailable: true,
        },
        { status: 503 }
      );
    }

    const simulation = simulateMeter(caseResult.caseData, tariff);

    return NextResponse.json({
      success: true,
      simulation,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Simulation failed" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getCaseById } from "@/lib/data/case-loader";
import { loadTariffConfig } from "@/lib/data/tariff-loader";
import { calculateTargetRecharge } from "@/lib/engine/advisor-engine";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { target_date, usual_daily_units } = body;

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

    if (target_date && target_date <= caseResult.caseData.today) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid target_date '${target_date}'. Target date must be strictly after today's date (${caseResult.caseData.today}).`,
        },
        { status: 400 }
      );
    }

    if (usual_daily_units !== undefined && Number(usual_daily_units) <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid usual_daily_units. Daily consumption rate must be greater than 0 kWh/day.",
        },
        { status: 400 }
      );
    }

    const target = calculateTargetRecharge(
      caseResult.caseData,
      tariff,
      target_date,
      usual_daily_units ? Number(usual_daily_units) : undefined
    );

    return NextResponse.json({
      success: true,
      target_recharge: target,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Target calculation failed" },
      { status: 500 }
    );
  }
}

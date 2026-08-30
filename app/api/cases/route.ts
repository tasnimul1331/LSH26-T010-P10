import { NextRequest, NextResponse } from "next/server";
import { loadAllCases, registerCustomCase } from "@/lib/data/case-loader";

export async function GET() {
  try {
    const { summaries } = loadAllCases();
    return NextResponse.json({
      success: true,
      count: summaries.length,
      cases: summaries,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load cases" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = registerCustomCase(body);
    if (!validation.is_valid) {
      return NextResponse.json(
        {
          success: false,
          error: `Case validation failed: ${validation.errors.join("; ")}`,
          validation,
        },
        { status: 400 }
      );
    }

    const { summaries } = loadAllCases();
    return NextResponse.json({
      success: true,
      case_id: body.case_id,
      validation,
      cases: summaries,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to register custom case" },
      { status: 500 }
    );
  }
}

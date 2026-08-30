import { NextRequest, NextResponse } from "next/server";
import { getCaseById } from "@/lib/data/case-loader";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = getCaseById(id);
    if (!result) {
      return NextResponse.json(
        { success: false, error: `Case '${id}' not found` },
        { status: 404 }
      );
    }
    return NextResponse.json({
      success: true,
      case: result.caseData,
      validation: result.validation,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve case" },
      { status: 500 }
    );
  }
}

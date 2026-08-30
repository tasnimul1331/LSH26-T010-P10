import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    version: "1.0.0",
    service: "METERLY - Prepaid Energy Intelligence",
    timestamp: new Date().toISOString(),
  });
}

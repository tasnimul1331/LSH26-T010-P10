import { NextRequest, NextResponse } from "next/server";
import { loadTariffConfig, setCustomTariff, setTariffUnavailableMode } from "@/lib/data/tariff-loader";
import { TariffConfigSchema } from "@/lib/validation/tariff-schema";

export async function GET() {
  try {
    const tariff = loadTariffConfig();
    return NextResponse.json({
      success: true,
      tariff,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load tariff" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.unavailable_mode !== undefined) {
      setTariffUnavailableMode(Boolean(body.unavailable_mode));
      return NextResponse.json({
        success: true,
        message: body.unavailable_mode ? "Tariff set to unavailable mode" : "Tariff restored",
        tariff: loadTariffConfig(),
      });
    }

    if (body.reset_default) {
      setCustomTariff(null);
      setTariffUnavailableMode(false);
      return NextResponse.json({
        success: true,
        message: "Tariff reset to authoritative default",
        tariff: loadTariffConfig(),
      });
    }

    const validated = TariffConfigSchema.parse(body.tariff);
    setCustomTariff(validated);
    setTariffUnavailableMode(false);

    return NextResponse.json({
      success: true,
      message: "Custom tariff applied successfully",
      tariff: validated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Invalid tariff configuration" },
      { status: 400 }
    );
  }
}

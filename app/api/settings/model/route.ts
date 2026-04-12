import { NextResponse } from "next/server";
import { AppError } from "@/lib/server/utils/errors";
import { getModelSettings, saveModelSettings } from "@/lib/server/settings/settings-service";
import type { ApiResponse } from "@/types/api";
import type { ModelSettings } from "@/types/settings";

export async function GET() {
  const settings = await getModelSettings();
  return NextResponse.json<ApiResponse<ModelSettings>>({
    success: true,
    data: settings,
  });
}

export async function PUT(request: Request) {
  try {
    const payload = (await request.json()) as ModelSettings;
    const settings = await saveModelSettings(payload);
    return NextResponse.json<ApiResponse<ModelSettings>>({
      success: true,
      data: settings,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error instanceof AppError ? error.code : "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : "Unable to save settings.",
        },
      } satisfies ApiResponse<ModelSettings>,
      {
        status: error instanceof AppError && error.code === "INVALID_REQUEST" ? 400 : 500,
      },
    );
  }
}

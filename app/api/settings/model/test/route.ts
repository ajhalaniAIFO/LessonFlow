import { NextResponse } from "next/server";
import { getProvider } from "@/lib/server/llm/provider-registry";
import type { HealthStatus } from "@/lib/server/llm/types";
import { parseModelSettings } from "@/lib/server/settings/settings-service";
import { AppError } from "@/lib/server/utils/errors";
import type { ApiResponse } from "@/types/api";

export async function POST(request: Request) {
  try {
    const rawPayload = await request.json();
    const settings = parseModelSettings(rawPayload);
    const provider = getProvider(settings.provider);
    const result = await provider.healthCheck(settings.baseUrl, settings.model);

    return NextResponse.json<ApiResponse<HealthStatus>>({
      success: true,
      data: result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error instanceof AppError ? error.code : "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : "Unable to test local model connection.",
        },
      } satisfies ApiResponse<HealthStatus>,
      {
        status: error instanceof AppError && error.code === "INVALID_REQUEST" ? 400 : 500,
      },
    );
  }
}

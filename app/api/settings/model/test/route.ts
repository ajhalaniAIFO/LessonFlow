import { NextResponse } from "next/server";
import { getProvider } from "@/lib/server/llm/provider-registry";
import type { HealthStatus } from "@/lib/server/llm/types";
import { buildRuntimeDiagnostics } from "@/lib/server/settings/runtime-diagnostics";
import { parseModelSettings } from "@/lib/server/settings/settings-service";
import { AppError } from "@/lib/server/utils/errors";
import type { ApiResponse } from "@/types/api";

type TestDiagnosticsResponse = {
  health: HealthStatus;
  hardwareSummary: string;
  accelerationHint: string;
  workloadFit: "comfortable" | "watch" | "strained";
  nextSteps: string[];
};

export async function POST(request: Request) {
  try {
    const rawPayload = await request.json();
    const settings = parseModelSettings(rawPayload);
    const provider = getProvider(settings.provider);
    const health = await provider.healthCheck(settings.baseUrl, settings.model);
    const diagnostics = buildRuntimeDiagnostics(settings, health);

    return NextResponse.json<ApiResponse<TestDiagnosticsResponse>>({
      success: true,
      data: diagnostics,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error instanceof AppError ? error.code : "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : "Unable to test local model connection.",
        },
      } satisfies ApiResponse<TestDiagnosticsResponse>,
      {
        status: error instanceof AppError && error.code === "INVALID_REQUEST" ? 400 : 500,
      },
    );
  }
}

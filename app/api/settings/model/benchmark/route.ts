import { NextResponse } from "next/server";
import { runSyntheticBenchmark } from "@/lib/server/settings/benchmark-service";
import { AppError } from "@/lib/server/utils/errors";
import type { ApiResponse } from "@/types/api";
import type { SyntheticBenchmarkRecord } from "@/types/settings";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const benchmark = await runSyntheticBenchmark(payload);

    return NextResponse.json<ApiResponse<SyntheticBenchmarkRecord>>({
      success: true,
      data: benchmark,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error instanceof AppError ? error.code : "INTERNAL_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Unable to run a synthetic benchmark.",
        },
      } satisfies ApiResponse<SyntheticBenchmarkRecord>,
      {
        status: error instanceof AppError && error.code === "INVALID_REQUEST" ? 400 : 500,
      },
    );
  }
}

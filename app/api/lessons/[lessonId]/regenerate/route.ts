import { NextResponse } from "next/server";
import { createLessonRegenerationJob } from "@/lib/server/lessons/lesson-service";
import { AppError } from "@/lib/server/utils/errors";
import type { ApiResponse } from "@/types/api";

type RegenerateResponse = {
  lessonId: string;
  jobId: string;
};

export async function POST(
  _request: Request,
  context: { params: Promise<{ lessonId: string }> },
) {
  try {
    const { lessonId } = await context.params;
    const result = await createLessonRegenerationJob(lessonId);

    return NextResponse.json<ApiResponse<RegenerateResponse>>({
      success: true,
      data: result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error instanceof AppError ? error.code : "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : "Unable to regenerate lesson.",
        },
      } satisfies ApiResponse<RegenerateResponse>,
      {
        status: error instanceof AppError && error.code === "INVALID_REQUEST" ? 400 : 500,
      },
    );
  }
}

import { NextResponse } from "next/server";
import { createOutlineGenerationJob } from "@/lib/server/lessons/lesson-service";
import { AppError } from "@/lib/server/utils/errors";
import type { ApiResponse } from "@/types/api";

type ConfirmOutlineResponse = {
  lessonId: string;
  jobId: string;
};

export async function POST(
  _request: Request,
  context: { params: Promise<{ lessonId: string }> },
) {
  try {
    const { lessonId } = await context.params;
    const result = await createOutlineGenerationJob(lessonId);

    return NextResponse.json<ApiResponse<ConfirmOutlineResponse>>({
      success: true,
      data: result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error instanceof AppError ? error.code : "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : "Unable to continue lesson generation.",
        },
      } satisfies ApiResponse<ConfirmOutlineResponse>,
      {
        status: error instanceof AppError && error.code === "INVALID_REQUEST" ? 400 : 500,
      },
    );
  }
}

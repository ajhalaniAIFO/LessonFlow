import { NextResponse } from "next/server";
import { rememberLessonProgress } from "@/lib/server/lessons/lesson-service";
import { AppError } from "@/lib/server/utils/errors";
import type { ApiResponse } from "@/types/api";

type ProgressResponse = {
  successMessage: string;
};

export async function POST(
  request: Request,
  context: { params: Promise<{ lessonId: string }> },
) {
  try {
    const { lessonId } = await context.params;
    const payload = (await request.json()) as { sceneOrder?: number };
    await rememberLessonProgress(lessonId, Number(payload.sceneOrder));

    return NextResponse.json<ApiResponse<ProgressResponse>>({
      success: true,
      data: {
        successMessage: "Lesson progress saved.",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error instanceof AppError ? error.code : "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : "Unable to save lesson progress.",
        },
      } satisfies ApiResponse<ProgressResponse>,
      {
        status: error instanceof AppError && error.code === "INVALID_REQUEST" ? 400 : 500,
      },
    );
  }
}

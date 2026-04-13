import { NextResponse } from "next/server";
import { updateLessonOutline } from "@/lib/server/lessons/lesson-service";
import { AppError } from "@/lib/server/utils/errors";
import type { ApiResponse } from "@/types/api";
import type { Lesson, OutlineReviewUpdate } from "@/types/lesson";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ lessonId: string }> },
) {
  try {
    const { lessonId } = await context.params;
    const payload = (await request.json()) as OutlineReviewUpdate;
    const lesson = await updateLessonOutline(lessonId, payload);

    return NextResponse.json<ApiResponse<Lesson | null>>({
      success: true,
      data: lesson,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error instanceof AppError ? error.code : "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : "Unable to update outline.",
        },
      } satisfies ApiResponse<Lesson | null>,
      {
        status: error instanceof AppError && error.code === "INVALID_REQUEST" ? 400 : 500,
      },
    );
  }
}

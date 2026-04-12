import { NextResponse } from "next/server";
import { regenerateLessonScene } from "@/lib/server/lessons/lesson-service";
import { AppError } from "@/lib/server/utils/errors";
import type { ApiResponse } from "@/types/api";
import type { Lesson } from "@/types/lesson";

type RegenerateSceneResponse = {
  lesson: Lesson | null;
};

export async function POST(
  _request: Request,
  context: { params: Promise<{ lessonId: string; sceneId: string }> },
) {
  try {
    const { lessonId, sceneId } = await context.params;
    const lesson = await regenerateLessonScene(lessonId, sceneId);

    return NextResponse.json<ApiResponse<RegenerateSceneResponse>>({
      success: true,
      data: {
        lesson,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error instanceof AppError ? error.code : "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : "Unable to regenerate scene.",
        },
      } satisfies ApiResponse<RegenerateSceneResponse>,
      {
        status: error instanceof AppError && error.code === "INVALID_REQUEST" ? 400 : 500,
      },
    );
  }
}

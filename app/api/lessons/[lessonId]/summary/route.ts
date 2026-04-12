import { NextResponse } from "next/server";
import { getLessonById } from "@/lib/server/lessons/lesson-service";
import { buildLessonSummary } from "@/lib/server/lessons/lesson-summary";
import type { ApiResponse } from "@/types/api";

type SummaryResponse = {
  markdown: string;
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ lessonId: string }> },
) {
  const { lessonId } = await context.params;
  const lesson = await getLessonById(lessonId);

  if (!lesson) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Lesson not found.",
        },
      } satisfies ApiResponse<SummaryResponse>,
      { status: 404 },
    );
  }

  return NextResponse.json<ApiResponse<SummaryResponse>>({
    success: true,
    data: {
      markdown: buildLessonSummary(lesson),
    },
  });
}

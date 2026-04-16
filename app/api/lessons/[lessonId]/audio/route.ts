import { NextResponse } from "next/server";
import { generateLessonAudioExport } from "@/lib/server/lessons/audio-export";
import { getLessonById } from "@/lib/server/lessons/lesson-service";
import { AppError } from "@/lib/server/utils/errors";
import type { ApiResponse } from "@/types/api";

export const runtime = "nodejs";

type ErrorResponse = ApiResponse<never>;

export async function GET(
  request: Request,
  context: { params: Promise<{ lessonId: string }> },
) {
  try {
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
        } satisfies ErrorResponse,
        { status: 404 },
      );
    }

    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope") === "scene" ? "scene" : "lesson";
    const sceneId = searchParams.get("sceneId") ?? undefined;
    const exportResult = await generateLessonAudioExport(lesson, { scope, sceneId });

    return new NextResponse(exportResult.buffer, {
      status: 200,
      headers: {
        "Content-Type": exportResult.contentType,
        "Content-Disposition": `attachment; filename="${exportResult.filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error instanceof AppError ? error.code : "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : "Unable to export lesson audio.",
        },
      } satisfies ErrorResponse,
      {
        status: error instanceof AppError && error.code === "INVALID_REQUEST" ? 400 : 500,
      },
    );
  }
}

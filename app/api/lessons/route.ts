import { NextResponse } from "next/server";
import { createLessonJob, parseCreateLessonRequest } from "@/lib/server/lessons/lesson-service";
import { AppError } from "@/lib/server/utils/errors";
import type { ApiResponse } from "@/types/api";

type CreateLessonResponse = {
  lessonId: string;
  jobId: string;
};

export async function POST(request: Request) {
  try {
    const payload = parseCreateLessonRequest(await request.json());
    const result = await createLessonJob(payload);

    return NextResponse.json<ApiResponse<CreateLessonResponse>>({
      success: true,
      data: result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error instanceof AppError ? error.code : "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : "Unable to create lesson job.",
        },
      } satisfies ApiResponse<CreateLessonResponse>,
      {
        status: error instanceof AppError && error.code === "INVALID_REQUEST" ? 400 : 500,
      },
    );
  }
}

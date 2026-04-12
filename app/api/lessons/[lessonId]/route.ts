import { NextResponse } from "next/server";
import {
  deleteLessonById,
  renameLesson,
} from "@/lib/server/lessons/lesson-service";
import { AppError } from "@/lib/server/utils/errors";
import type { ApiResponse } from "@/types/api";

type MutationResponse = {
  successMessage: string;
};

export async function PATCH(
  request: Request,
  context: { params: Promise<{ lessonId: string }> },
) {
  try {
    const { lessonId } = await context.params;
    const payload = (await request.json()) as { title?: string };
    await renameLesson(lessonId, payload.title ?? "");

    return NextResponse.json<ApiResponse<MutationResponse>>({
      success: true,
      data: {
        successMessage: "Lesson renamed successfully.",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error instanceof AppError ? error.code : "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : "Unable to rename lesson.",
        },
      } satisfies ApiResponse<MutationResponse>,
      {
        status: error instanceof AppError && error.code === "INVALID_REQUEST" ? 400 : 500,
      },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ lessonId: string }> },
) {
  try {
    const { lessonId } = await context.params;
    await deleteLessonById(lessonId);

    return NextResponse.json<ApiResponse<MutationResponse>>({
      success: true,
      data: {
        successMessage: "Lesson deleted successfully.",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error instanceof AppError ? error.code : "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : "Unable to delete lesson.",
        },
      } satisfies ApiResponse<MutationResponse>,
      {
        status: error instanceof AppError && error.code === "INVALID_REQUEST" ? 400 : 500,
      },
    );
  }
}

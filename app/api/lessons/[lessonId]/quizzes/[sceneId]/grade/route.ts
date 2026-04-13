import { NextResponse } from "next/server";
import { gradeQuizAnswers, listQuizAttempts } from "@/lib/server/lessons/quiz-service";
import { AppError } from "@/lib/server/utils/errors";
import type { ApiResponse } from "@/types/api";
import type { QuizAnswerSubmission, QuizAttempt } from "@/types/scene";

type GradeResponse = ReturnType<typeof gradeQuizAnswers>;
type AttemptHistoryResponse = {
  attempts: QuizAttempt[];
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ lessonId: string; sceneId: string }> },
) {
  try {
    const { lessonId, sceneId } = await context.params;
    const attempts = listQuizAttempts(lessonId, sceneId);

    return NextResponse.json<ApiResponse<AttemptHistoryResponse>>({
      success: true,
      data: {
        attempts,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error instanceof AppError ? error.code : "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : "Unable to load quiz history.",
        },
      } satisfies ApiResponse<AttemptHistoryResponse>,
      {
        status: error instanceof AppError && error.code === "INVALID_REQUEST" ? 400 : 500,
      },
    );
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ lessonId: string; sceneId: string }> },
) {
  try {
    const { lessonId, sceneId } = await context.params;
    const payload = (await request.json()) as { answers?: QuizAnswerSubmission[] };
    const result = gradeQuizAnswers({
      lessonId,
      sceneId,
      answers: payload.answers ?? [],
    });

    return NextResponse.json<ApiResponse<GradeResponse>>({
      success: true,
      data: result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error instanceof AppError ? error.code : "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : "Unable to grade quiz answers.",
        },
      } satisfies ApiResponse<GradeResponse>,
      {
        status: error instanceof AppError && error.code === "INVALID_REQUEST" ? 400 : 500,
      },
    );
  }
}

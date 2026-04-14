import { NextResponse } from "next/server";
import { saveInteractiveBlockProgress } from "@/lib/server/lessons/lesson-service";
import { AppError } from "@/lib/server/utils/errors";
import type { ApiResponse } from "@/types/api";
import type { InteractiveBlockKind } from "@/types/scene";

type SaveResponse = {
  successMessage: string;
};

export async function POST(
  request: Request,
  context: { params: Promise<{ lessonId: string; sceneId: string }> },
) {
  try {
    const { lessonId, sceneId } = await context.params;
    const payload = (await request.json()) as {
      blockKind?: InteractiveBlockKind;
      completed?: boolean;
    };

    await saveInteractiveBlockProgress(
      lessonId,
      sceneId,
      String(payload.blockKind ?? "") as InteractiveBlockKind,
      Boolean(payload.completed),
    );

    return NextResponse.json<ApiResponse<SaveResponse>>({
      success: true,
      data: {
        successMessage: "Interactive progress saved.",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error instanceof AppError ? error.code : "INTERNAL_ERROR",
          message:
            error instanceof Error ? error.message : "Unable to save interactive progress.",
        },
      } satisfies ApiResponse<SaveResponse>,
      {
        status: error instanceof AppError && error.code === "INVALID_REQUEST" ? 400 : 500,
      },
    );
  }
}

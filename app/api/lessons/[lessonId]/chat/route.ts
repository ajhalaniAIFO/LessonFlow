import { NextResponse } from "next/server";
import { listChatMessages, sendTutorMessage } from "@/lib/server/lessons/chat-service";
import { AppError } from "@/lib/server/utils/errors";
import type { ApiResponse } from "@/types/api";
import type { ChatMessage } from "@/types/chat";

type SendResponse = {
  message: ChatMessage;
};

export async function GET(
  request: Request,
  context: { params: Promise<{ lessonId: string }> },
) {
  const { lessonId } = await context.params;
  const { searchParams } = new URL(request.url);
  const sceneId = searchParams.get("sceneId") ?? undefined;
  const messages = await listChatMessages(lessonId, sceneId);

  return NextResponse.json<ApiResponse<{ messages: ChatMessage[] }>>({
    success: true,
    data: {
      messages,
    },
  });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ lessonId: string }> },
) {
  try {
    const { lessonId } = await context.params;
    const payload = (await request.json()) as { content?: string; sceneId?: string };
    const message = await sendTutorMessage(lessonId, payload.content ?? "", {
      sceneId: payload.sceneId?.trim() || undefined,
    });

    return NextResponse.json<ApiResponse<SendResponse>>({
      success: true,
      data: {
        message,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error instanceof AppError ? error.code : "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : "Unable to send tutor message.",
        },
      } satisfies ApiResponse<SendResponse>,
      {
        status: error instanceof AppError && error.code === "INVALID_REQUEST" ? 400 : 500,
      },
    );
  }
}

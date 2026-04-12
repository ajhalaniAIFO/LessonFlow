import { NextResponse } from "next/server";
import { getLessonJob } from "@/lib/server/lessons/lesson-service";
import type { ApiResponse } from "@/types/api";
import type { LessonJob } from "@/types/job";

export async function GET(
  _request: Request,
  context: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await context.params;
  const job = await getLessonJob(jobId);

  if (!job) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Job not found.",
        },
      } satisfies ApiResponse<LessonJob>,
      { status: 404 },
    );
  }

  return NextResponse.json<ApiResponse<LessonJob>>({
    success: true,
    data: job,
  });
}

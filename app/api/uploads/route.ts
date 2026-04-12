import { NextResponse } from "next/server";
import { createUpload } from "@/lib/server/uploads/upload-service";
import { AppError } from "@/lib/server/utils/errors";
import type { ApiResponse } from "@/types/api";
import type { UploadRecord } from "@/types/upload";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      throw new AppError("INVALID_REQUEST", "A file upload is required.");
    }

    const upload = await createUpload(file);

    return NextResponse.json<ApiResponse<UploadRecord>>({
      success: true,
      data: upload,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error instanceof AppError ? error.code : "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : "Unable to upload document.",
        },
      } satisfies ApiResponse<UploadRecord>,
      {
        status: error instanceof AppError && error.code === "INVALID_REQUEST" ? 400 : 500,
      },
    );
  }
}

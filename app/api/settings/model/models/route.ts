import { NextResponse } from "next/server";
import { getProvider } from "@/lib/server/llm/provider-registry";
import { AppError } from "@/lib/server/utils/errors";
import type { ApiResponse } from "@/types/api";
import type { ModelInfo } from "@/lib/server/llm/types";
import type { ModelProvider } from "@/types/settings";

type ModelsPayload = {
  models: ModelInfo[];
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const baseUrl = searchParams.get("baseUrl");
    const providerName = (searchParams.get("provider") as ModelProvider | null) ?? "ollama";

    if (!baseUrl) {
      throw new AppError("INVALID_REQUEST", "A baseUrl query parameter is required.");
    }

    const provider = getProvider(providerName);
    const models = await provider.listModels(baseUrl);

    return NextResponse.json<ApiResponse<ModelsPayload>>({
      success: true,
      data: {
        models,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error instanceof AppError ? error.code : "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : "Unable to list local models.",
        },
      } satisfies ApiResponse<ModelsPayload>,
      {
        status: error instanceof AppError && error.code === "INVALID_REQUEST" ? 400 : 500,
      },
    );
  }
}

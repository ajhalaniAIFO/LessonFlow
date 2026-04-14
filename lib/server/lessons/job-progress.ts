import type { LessonJob, LessonJobStatus } from "@/types/job";

export type GenerationStageDescriptor = {
  key: Exclude<LessonJobStatus, "queued" | "ready" | "error" | "awaiting_review">;
  label: string;
  description: string;
};

export const generationStages: GenerationStageDescriptor[] = [
  {
    key: "extracting_document",
    label: "Extract document",
    description: "Pulling local text from your uploaded material.",
  },
  {
    key: "generating_outline",
    label: "Build outline",
    description: "Creating the teaching sequence for the lesson.",
  },
  {
    key: "generating_scenes",
    label: "Generate scenes",
    description: "Writing the lesson scenes for each outline step.",
  },
  {
    key: "generating_quizzes",
    label: "Generate quizzes",
    description: "Creating knowledge checks tied to the lesson content.",
  },
];

export function formatTelemetryDuration(milliseconds?: number) {
  if (typeof milliseconds !== "number") {
    return "n/a";
  }

  if (milliseconds < 1000) {
    return `${milliseconds} ms`;
  }

  if (milliseconds < 60_000) {
    return `${(milliseconds / 1000).toFixed(1)} s`;
  }

  return `${(milliseconds / 60_000).toFixed(1)} min`;
}

export function getStageState(job: LessonJob | null, stageKey: GenerationStageDescriptor["key"]) {
  if (!job) {
    return "upcoming" as const;
  }

  if (job.status === "error") {
    if (job.stage === stageKey) {
      return "error" as const;
    }

    const currentIndex = generationStages.findIndex((stage) => stage.key === job.stage);
    const stageIndex = generationStages.findIndex((stage) => stage.key === stageKey);
    return stageIndex < currentIndex ? ("complete" as const) : ("upcoming" as const);
  }

  if (job.status === "ready") {
    return "complete" as const;
  }

  if (job.status === "awaiting_review") {
    return stageKey === "generating_outline" ? ("complete" as const) : ("upcoming" as const);
  }

  const currentIndex = generationStages.findIndex((stage) => stage.key === job.stage);
  const stageIndex = generationStages.findIndex((stage) => stage.key === stageKey);

  if (job.status === "queued") {
    return "upcoming" as const;
  }

  if (stageIndex < currentIndex) {
    return "complete" as const;
  }

  if (stageIndex === currentIndex) {
    return "active" as const;
  }

  return "upcoming" as const;
}

export function getJobHeadline(job: LessonJob | null) {
  if (!job) {
    return "Preparing your lesson job";
  }

  switch (job.status) {
    case "queued":
      return "Your lesson is queued";
    case "extracting_document":
      return "Extracting source material";
    case "generating_outline":
      return "Building your lesson outline";
    case "generating_scenes":
      return "Generating lesson scenes";
    case "generating_quizzes":
      return "Generating quiz scenes";
    case "awaiting_review":
      return "Review your outline";
    case "ready":
      return "Your lesson is ready";
    case "error":
      return "Lesson generation needs attention";
    default:
      return "Preparing your lesson";
  }
}

export function getJobSupportCopy(job: LessonJob | null) {
  if (!job) {
    return "We are preparing the local job runner and will start as soon as the first stage is available.";
  }

  if (job.status === "ready") {
    return "Everything is saved locally and ready to open.";
  }

  if (job.status === "awaiting_review") {
    return "Your outline is ready. Review it, make any quick edits you want, and then continue to full lesson generation.";
  }

  if (job.status === "error") {
    return "The lesson was not completed. You can review the message below and try again after adjusting the model or prompt.";
  }

  return job.message ?? "Your lesson is moving through the local generation pipeline.";
}

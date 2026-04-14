export type LessonJobStatus =
  | "queued"
  | "extracting_document"
  | "generating_outline"
  | "awaiting_review"
  | "generating_scenes"
  | "generating_quizzes"
  | "ready"
  | "error";

export type LessonJobTelemetry = {
  outlineMs?: number;
  sceneGenerationMs?: number;
  quizGenerationMs?: number;
  totalMs?: number;
  lessonSceneCount?: number;
  quizSceneCount?: number;
};

export type LessonJob = {
  id: string;
  lessonId: string;
  status: LessonJobStatus;
  progress: number;
  stage: LessonJobStatus;
  message?: string;
  errorMessage?: string;
  telemetry?: LessonJobTelemetry;
};

export type RuntimeUsageJobInsight = {
  jobId: string;
  lessonId: string;
  lessonTitle: string;
  status: LessonJobStatus;
  updatedAt: number;
  telemetry?: LessonJobTelemetry;
};

export type RuntimeUsageDashboard = {
  recentJobs: RuntimeUsageJobInsight[];
  completedJobs: number;
  averageTotalMs?: number;
  fastestTotalMs?: number;
  slowestTotalMs?: number;
  totalLessonScenes: number;
  totalQuizScenes: number;
};

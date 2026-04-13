export type LessonJobStatus =
  | "queued"
  | "extracting_document"
  | "generating_outline"
  | "awaiting_review"
  | "generating_scenes"
  | "generating_quizzes"
  | "ready"
  | "error";

export type LessonJob = {
  id: string;
  lessonId: string;
  status: LessonJobStatus;
  progress: number;
  stage: LessonJobStatus;
  message?: string;
  errorMessage?: string;
};

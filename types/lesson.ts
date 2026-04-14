import type { InteractiveBlockProgress, Scene, SceneType } from "./scene";

export type GenerationMode = "fast" | "balanced" | "detailed";
export type LearnerLevel = "beginner" | "intermediate" | "advanced";
export type TeachingStyle = "concise" | "practical" | "step_by_step";
export type LessonFormat = "standard" | "workshop" | "guided_project";

export type OutlineItem = {
  id: string;
  title: string;
  goal?: string;
  sceneType: SceneType;
  order: number;
};

export type LessonStatus = "draft" | "generating" | "ready" | "error";

export type Lesson = {
  id: string;
  title: string;
  prompt?: string;
  sourceUploadId?: string;
  sourceType: "prompt" | "document" | "prompt_and_document";
  language: string;
  generationMode: GenerationMode;
  learnerLevel: LearnerLevel;
  teachingStyle: TeachingStyle;
  lessonFormat: LessonFormat;
  status: LessonStatus;
  outline: OutlineItem[];
  scenes: Scene[];
  interactiveBlockProgress: InteractiveBlockProgress[];
  lastViewedSceneOrder?: number;
  errorMessage?: string;
  createdAt: number;
  updatedAt: number;
};

export type CreateLessonRequest = {
  prompt?: string;
  language: string;
  uploadId?: string;
  generationMode?: GenerationMode;
  learnerLevel?: LearnerLevel;
  teachingStyle?: TeachingStyle;
  lessonFormat?: LessonFormat;
};

export type OutlineReviewUpdate = {
  lessonTitle: string;
  items: Array<{
    id: string;
    title: string;
    goal?: string;
    order?: number;
    sceneType?: SceneType;
  }>;
};

export type LessonListItem = {
  id: string;
  title: string;
  status: LessonStatus;
  generationMode: GenerationMode;
  learnerLevel: LearnerLevel;
  teachingStyle: TeachingStyle;
  lessonFormat: LessonFormat;
  sceneCount: number;
  lastViewedSceneOrder?: number;
  updatedAt: number;
};

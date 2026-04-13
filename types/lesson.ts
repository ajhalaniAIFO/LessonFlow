import type { Scene, SceneType } from "./scene";

export type GenerationMode = "fast" | "balanced" | "detailed";

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
  status: LessonStatus;
  outline: OutlineItem[];
  scenes: Scene[];
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
  sceneCount: number;
  lastViewedSceneOrder?: number;
  updatedAt: number;
};

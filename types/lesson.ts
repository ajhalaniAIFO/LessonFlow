import type { Scene, SceneType } from "./scene";

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
  sourceType: "prompt" | "document" | "prompt_and_document";
  language: string;
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
};

export type OutlineReviewUpdate = {
  lessonTitle: string;
  items: Array<{
    id: string;
    title: string;
    goal?: string;
  }>;
};

export type LessonListItem = {
  id: string;
  title: string;
  status: LessonStatus;
  sceneCount: number;
  lastViewedSceneOrder?: number;
  updatedAt: number;
};

import type { SceneType } from "./scene";

export type OutlineItem = {
  id: string;
  title: string;
  goal?: string;
  sceneType: SceneType;
  order: number;
};

export type Lesson = {
  id: string;
  title: string;
  sourceType: "prompt" | "document" | "prompt_and_document";
  language: string;
  status: "draft" | "generating" | "ready" | "error";
  outline: OutlineItem[];
  createdAt: number;
  updatedAt: number;
};


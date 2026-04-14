import type { SourceContext } from "./upload";

export type SceneType = "lesson" | "quiz";

export type LessonSection = {
  heading: string;
  body: string;
  bullets?: string[];
};

export type LessonSceneContent = {
  summary: string;
  sections: LessonSection[];
  keyTakeaways?: string[];
  sourceContext?: SourceContext;
};

export type QuizQuestion = {
  id: string;
  prompt: string;
  type: "multiple_choice";
  options: string[];
  correctIndex: number;
  explanation: string;
};

export type QuizSceneContent = {
  questions: QuizQuestion[];
  sourceContext?: SourceContext;
};

export type QuizAnswerSubmission = {
  questionId: string;
  selectedIndex: number;
};

export type QuizAnswerResult = {
  questionId: string;
  selectedIndex: number;
  correctIndex: number;
  correct: boolean;
  explanation: string;
};

export type QuizAttempt = {
  id: string;
  sceneId: string;
  score: {
    correct: number;
    total: number;
  };
  results: QuizAnswerResult[];
  createdAt: number;
};

export type InteractiveBlockKind = "action" | "checkpoint";

export type InteractiveBlockProgress = {
  sceneId: string;
  blockKind: InteractiveBlockKind;
  completed: boolean;
  updatedAt: number;
};

export type SceneStatus = "pending" | "ready" | "error";

export type Scene = {
  id: string;
  lessonId: string;
  outlineItemId: string;
  type: SceneType;
  title: string;
  order: number;
  status: SceneStatus;
  content?: LessonSceneContent | QuizSceneContent;
  errorMessage?: string;
};

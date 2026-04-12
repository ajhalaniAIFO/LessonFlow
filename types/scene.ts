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

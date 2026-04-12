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


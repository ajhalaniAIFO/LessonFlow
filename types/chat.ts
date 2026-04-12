export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  lessonId: string;
  sceneId?: string;
  role: ChatRole;
  content: string;
  createdAt: number;
};

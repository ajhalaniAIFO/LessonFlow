export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  lessonId: string;
  role: ChatRole;
  content: string;
  createdAt: number;
};

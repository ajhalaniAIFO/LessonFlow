import { z } from "zod";

export const quizQuestionSchema = z.object({
  prompt: z.string().trim().min(8),
  type: z.literal("multiple_choice"),
  options: z.array(z.string().trim().min(1)).length(4),
  correctIndex: z.number().int().min(0).max(3),
  explanation: z.string().trim().min(8),
});

export const quizSceneResponseSchema = z.object({
  title: z.string().trim().min(3),
  questions: z.array(quizQuestionSchema).min(1).max(3),
});

export type QuizSceneResponse = z.infer<typeof quizSceneResponseSchema>;

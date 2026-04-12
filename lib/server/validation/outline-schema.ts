import { z } from "zod";

export const outlineItemSchema = z.object({
  title: z.string().trim().min(3),
  goal: z.string().trim().optional(),
  sceneType: z.enum(["lesson", "quiz"]),
});

export const outlineResponseSchema = z.object({
  title: z.string().trim().min(3),
  outline: z.array(outlineItemSchema).min(3),
});

export type OutlineResponse = z.infer<typeof outlineResponseSchema>;

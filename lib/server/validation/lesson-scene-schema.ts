import { z } from "zod";

export const lessonSectionSchema = z.object({
  heading: z.string().trim().min(2),
  body: z.string().trim().min(10),
  bullets: z.array(z.string().trim().min(2)).optional(),
});

export const lessonSceneResponseSchema = z.object({
  title: z.string().trim().min(3),
  summary: z.string().trim().min(10),
  sections: z.array(lessonSectionSchema).min(2),
  keyTakeaways: z.array(z.string().trim().min(2)).min(2).optional(),
});

export type LessonSceneResponse = z.infer<typeof lessonSceneResponseSchema>;

import type { LessonFormat } from "@/types/lesson";

type LessonFormatDefinition = {
  id: LessonFormat;
  label: string;
  description: string;
  outlineGuidance: string;
  sceneGuidance: string;
  quizGuidance: string;
  chatGuidance: string;
};

const lessonFormats: Record<LessonFormat, LessonFormatDefinition> = {
  standard: {
    id: "standard",
    label: "Standard lesson",
    description: "A structured teaching flow with explanation first and practice near the end.",
    outlineGuidance:
      "Use a classic lesson structure with clear teaching progression and one quiz near the end.",
    sceneGuidance:
      "Teach the concept clearly, focusing on explanation and understanding before application.",
    quizGuidance:
      "Use quizzes to reinforce the main taught ideas and check core understanding.",
    chatGuidance:
      "Act like a focused tutor helping the learner understand the lesson content more clearly.",
  },
  workshop: {
    id: "workshop",
    label: "Workshop",
    description: "A more hands-on format that leans on practice, checkpoints, and applied steps.",
    outlineGuidance:
      "Favor a workshop structure with short explanation blocks, practical checkpoints, and active application moments.",
    sceneGuidance:
      "Frame the teaching scene like a workshop segment with concrete tasks, guided practice, or application prompts where useful.",
    quizGuidance:
      "Use quizzes like workshop checkpoints that quickly verify whether the learner can apply the idea.",
    chatGuidance:
      "Act like a workshop facilitator who nudges the learner through practical application, not just abstract explanation.",
  },
  guided_project: {
    id: "guided_project",
    label: "Guided project",
    description: "Organizes the lesson around building toward a concrete outcome or mini project.",
    outlineGuidance:
      "Shape the lesson around a guided project arc with setup, build steps, and reflection/checkpoint moments.",
    sceneGuidance:
      "Teach each scene as part of progressing through a guided project, making the learner feel they are building toward a concrete outcome.",
    quizGuidance:
      "Use quizzes as project checkpoints that confirm readiness for the next build step.",
    chatGuidance:
      "Act like a project mentor who helps the learner move forward, troubleshoot, and understand why each step matters.",
  },
};

export function listLessonFormats() {
  return Object.values(lessonFormats);
}

export function getLessonFormatDefinition(format: LessonFormat) {
  return lessonFormats[format];
}

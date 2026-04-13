import type { LearnerLevel, TeachingStyle } from "@/types/lesson";

type LearnerLevelDefinition = {
  id: LearnerLevel;
  label: string;
  description: string;
  guidance: string;
};

type TeachingStyleDefinition = {
  id: TeachingStyle;
  label: string;
  description: string;
  guidance: string;
};

const learnerLevels: Record<LearnerLevel, LearnerLevelDefinition> = {
  beginner: {
    id: "beginner",
    label: "Beginner",
    description: "Assumes little prior knowledge and explains terms clearly.",
    guidance:
      "Assume the learner is new to the topic. Define terms, avoid big jumps, and build understanding from fundamentals.",
  },
  intermediate: {
    id: "intermediate",
    label: "Intermediate",
    description: "Builds on basic familiarity and moves at a steady pace.",
    guidance:
      "Assume the learner knows the basics. Focus on strengthening understanding and connecting ideas with moderate depth.",
  },
  advanced: {
    id: "advanced",
    label: "Advanced",
    description: "Moves faster and emphasizes nuance, tradeoffs, and deeper reasoning.",
    guidance:
      "Assume the learner is comfortable with the fundamentals. Move efficiently and emphasize nuance, comparisons, and deeper conceptual links.",
  },
};

const teachingStyles: Record<TeachingStyle, TeachingStyleDefinition> = {
  concise: {
    id: "concise",
    label: "Concise",
    description: "Shorter explanations that stay focused on the key idea.",
    guidance:
      "Keep explanations compact and direct. Prioritize signal over elaboration and avoid unnecessary detail.",
  },
  practical: {
    id: "practical",
    label: "Practical",
    description: "Uses concrete application and real-world framing where useful.",
    guidance:
      "Ground explanations in practical examples, applications, and why the concept matters in real situations.",
  },
  step_by_step: {
    id: "step_by_step",
    label: "Step-by-step",
    description: "Breaks ideas into smaller sequential teaching moves.",
    guidance:
      "Teach in a step-by-step way. Break ideas into smaller stages and make transitions explicit so the learner can follow the reasoning.",
  },
};

export function listLearnerLevels() {
  return Object.values(learnerLevels);
}

export function listTeachingStyles() {
  return Object.values(teachingStyles);
}

export function getLearnerLevelDefinition(level: LearnerLevel) {
  return learnerLevels[level];
}

export function getTeachingStyleDefinition(style: TeachingStyle) {
  return teachingStyles[style];
}

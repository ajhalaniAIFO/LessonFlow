import type { LessonFormat } from "@/types/lesson";
import type { Scene } from "@/types/scene";

type FormatCopy = {
  heroEyebrow: string;
  pathTitle: string;
  stageTitle: string;
  summaryTitle: string;
  sceneLabel: (scene: Scene) => string;
  focusCard: (scene: Scene) => {
    title: string;
    copy: string;
    bullets: string[];
  };
  actionBlock?: (scene: Scene) => {
    title: string;
    prompt: string;
    steps: string[];
  } | null;
  checkpointBlock?: (scene: Scene) => {
    title: string;
    prompt: string;
    checks: string[];
  } | null;
};

const formatCopy: Record<LessonFormat, FormatCopy> = {
  standard: {
    heroEyebrow: "Lesson Ready",
    pathTitle: "Lesson path",
    stageTitle: "Current scene",
    summaryTitle: "Study focus",
    sceneLabel: (scene) => (scene.type === "lesson" ? "Teaching scene" : "Quiz scene"),
    focusCard: (scene) => ({
      title: "Study focus",
      copy:
        scene.type === "lesson"
          ? "Work through the explanation, pause on key ideas, and use the takeaways to lock in the concept."
          : "Treat this quiz as a quick understanding check before moving on.",
      bullets:
        scene.type === "lesson"
          ? ["Read for understanding first", "Use key takeaways as a recap", "Move on when the main idea feels clear"]
          : ["Answer from memory first", "Use the explanation to correct gaps", "Continue once the core idea is solid"],
    }),
    actionBlock: () => null,
    checkpointBlock: () => null,
  },
  workshop: {
    heroEyebrow: "Workshop Ready",
    pathTitle: "Workshop path",
    stageTitle: "Current workshop segment",
    summaryTitle: "Workshop move",
    sceneLabel: (scene) => (scene.type === "lesson" ? "Practice segment" : "Checkpoint quiz"),
    focusCard: (scene) => ({
      title: scene.type === "lesson" ? "Workshop move" : "Checkpoint move",
      copy:
        scene.type === "lesson"
          ? "Treat this segment like a guided workshop step: try the idea actively, not just passively."
          : "Use this checkpoint to test whether you can apply the workshop step before continuing.",
      bullets:
        scene.type === "lesson"
          ? ["Read the segment once", "Try to restate the move in your own words", "Connect it to a practical example before advancing"]
          : ["Answer without peeking", "Review the explanation carefully", "Return to the prior segment if the checkpoint feels shaky"],
    }),
    actionBlock: (scene) =>
      scene.type === "lesson"
        ? {
            title: "Do this now",
            prompt: "Turn this workshop segment into action before you move on.",
            steps: [
              `Summarize "${scene.title}" in one or two sentences.`,
              "Write down one practical example or use case that fits this segment.",
              "Identify one question you would ask if you were facilitating this workshop live.",
            ],
          }
        : null,
    checkpointBlock: (scene) =>
      scene.type === "quiz"
        ? {
            title: "Checkpoint",
            prompt: "Use this checkpoint to decide whether you are ready for the next workshop move.",
            checks: [
              `Can you explain what "${scene.title}" is testing without looking back?`,
              "Can you connect the quiz prompt to a practical scenario?",
              "If one answer felt shaky, can you name exactly what to review before continuing?",
            ],
          }
        : null,
  },
  guided_project: {
    heroEyebrow: "Project Ready",
    pathTitle: "Project path",
    stageTitle: "Current build step",
    summaryTitle: "Project step",
    sceneLabel: (scene) => (scene.type === "lesson" ? "Build step" : "Project checkpoint"),
    focusCard: (scene) => ({
      title: scene.type === "lesson" ? "Project step" : "Project checkpoint",
      copy:
        scene.type === "lesson"
          ? "Use this scene like a build step in a guided project, focusing on what it enables next."
          : "Use this checkpoint to confirm you are ready for the next project step.",
      bullets:
        scene.type === "lesson"
          ? ["Identify what this step is trying to build", "Note the key decision or skill in this step", "Carry that forward into the next scene"]
          : ["Check whether you can explain the step outcome", "Use the feedback to close any gap", "Advance only when the project flow makes sense"],
    }),
    actionBlock: (scene) =>
      scene.type === "lesson"
        ? {
            title: "Build step",
            prompt: "Treat this scene like a project step with an explicit outcome.",
            steps: [
              `State the outcome this step should unlock in "${scene.title}".`,
              "Note the key decision, concept, or skill needed for this step.",
              "Write one sign that you are ready to move to the next build step.",
            ],
          }
        : null,
    checkpointBlock: (scene) =>
      scene.type === "quiz"
        ? {
            title: "Project checkpoint",
            prompt: "Use this checkpoint to confirm the project step is solid before moving forward.",
            checks: [
              `Can you explain how "${scene.title}" supports the overall project arc?`,
              "Can you name the most important idea from the prior build step from memory?",
              "If you missed a question, what exact project step needs reinforcement?",
            ],
          }
        : null,
  },
};

export function getFormatAwareCopy(format: LessonFormat) {
  return formatCopy[format];
}

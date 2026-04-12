import type { Lesson } from "@/types/lesson";

export function buildLessonSummary(lesson: Lesson) {
  const lines: string[] = [];

  lines.push(`# ${lesson.title}`);
  lines.push("");

  if (lesson.prompt) {
    lines.push(`Prompt: ${lesson.prompt}`);
    lines.push("");
  }

  lines.push("## Outline");
  lesson.outline.forEach((item) => {
    lines.push(`- ${item.order}. ${item.title}${item.goal ? ` — ${item.goal}` : ""}`);
  });
  lines.push("");

  lines.push("## Key Takeaways");
  const takeaways = lesson.scenes.flatMap((scene) => {
    if (!scene.content || !("keyTakeaways" in scene.content) || !scene.content.keyTakeaways) {
      return [];
    }

    return scene.content.keyTakeaways;
  });

  if (takeaways.length === 0) {
    lines.push("- No lesson takeaways were generated yet.");
  } else {
    [...new Set(takeaways)].forEach((takeaway) => {
      lines.push(`- ${takeaway}`);
    });
  }

  lines.push("");
  lines.push("## Scene Summaries");
  lesson.scenes.forEach((scene) => {
    lines.push(`### ${scene.order}. ${scene.title}`);

    if (scene.content && "summary" in scene.content) {
      lines.push(scene.content.summary);
      lines.push("");
      return;
    }

    if (scene.content && "questions" in scene.content) {
      scene.content.questions.forEach((question, index) => {
        lines.push(`- Quiz ${index + 1}: ${question.prompt}`);
      });
      lines.push("");
      return;
    }

    lines.push("No scene content available.");
    lines.push("");
  });

  return lines.join("\n").trim();
}

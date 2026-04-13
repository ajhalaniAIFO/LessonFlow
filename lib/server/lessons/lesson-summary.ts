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

export function buildOutlineReviewPreview(input: {
  lessonTitle: string;
  items: Array<{
    title: string;
    goal?: string;
    sceneType: "lesson" | "quiz";
  }>;
}) {
  const lessonItems = input.items.filter((item) => item.sceneType === "lesson");
  const quizItems = input.items.filter((item) => item.sceneType === "quiz");
  const openingItem = input.items[0];
  const closingItem = input.items[input.items.length - 1];

  const emphasis = [
    lessonItems.length >= 3 ? "a deeper teaching sequence" : "a concise teaching flow",
    quizItems.length >= 2 ? "multiple knowledge checks" : "a light knowledge check rhythm",
  ];

  const lines: string[] = [];
  lines.push(`${input.lessonTitle} currently looks like ${emphasis.join(" with ")}.`);

  if (openingItem) {
    lines.push(
      `It opens with ${openingItem.sceneType === "lesson" ? "a teaching section" : "a quiz"}: "${openingItem.title}".`,
    );
  }

  if (closingItem && closingItem !== openingItem) {
    lines.push(
      `It closes with ${closingItem.sceneType === "lesson" ? "a teaching section" : "a quiz"}: "${closingItem.title}".`,
    );
  }

  const goals = input.items
    .map((item) => item.goal?.trim())
    .filter((goal): goal is string => Boolean(goal));

  const highlights = goals.slice(0, 3);

  return {
    summary: lines.join(" "),
    highlights,
    totals: {
      lessonScenes: lessonItems.length,
      quizScenes: quizItems.length,
      totalItems: input.items.length,
    },
  };
}

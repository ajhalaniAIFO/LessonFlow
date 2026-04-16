import type { LessonSceneContent, QuizSceneContent } from "@/types/scene";

function cleanPart(value: string | undefined) {
  return value?.trim();
}

function normalizeSentence(value: string) {
  return value.trim().replace(/[.\s]+$/g, "");
}

function appendSentence(parts: string[], value: string | undefined) {
  const cleanValue = cleanPart(value);
  if (!cleanValue) {
    return;
  }

  parts.push(normalizeSentence(cleanValue));
}

function joinNarration(parts: string[]) {
  return parts.filter(Boolean).join(". ");
}

export function buildLessonSceneNarration(title: string, content: LessonSceneContent) {
  const parts: string[] = [];

  appendSentence(parts, title);
  appendSentence(parts, content.summary);

  for (const section of content.sections) {
    appendSentence(parts, section.heading);
    appendSentence(parts, section.body);

    if (section.bullets?.length) {
      appendSentence(
        parts,
        `Key points: ${section.bullets.map((bullet) => bullet.trim()).filter(Boolean).join(". ")}`,
      );
    }
  }

  if (content.keyTakeaways?.length) {
    appendSentence(
      parts,
      `Key takeaways: ${content.keyTakeaways.map((item) => item.trim()).filter(Boolean).join(". ")}`,
    );
  }

  return joinNarration(parts);
}

export function buildQuizSceneNarration(title: string, content: QuizSceneContent) {
  const parts: string[] = [];

  appendSentence(parts, title);

  content.questions.forEach((question, index) => {
    appendSentence(parts, `Question ${index + 1}. ${question.prompt}`);

    if (question.options.length) {
      appendSentence(
        parts,
        question.options
          .map((option, optionIndex) => `${String.fromCharCode(65 + optionIndex)}. ${option.trim()}`)
          .join(". "),
      );
    }
  });

  return joinNarration(parts);
}

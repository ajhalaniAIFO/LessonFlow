import type { SourceContext } from "@/types/upload";

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function splitIntoParagraphs(text: string) {
  return text
    .split(/\n\s*\n/)
    .map((chunk) => normalizeWhitespace(chunk))
    .filter(Boolean);
}

function tokenize(value: string) {
  return normalizeWhitespace(value)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 4);
}

function unique<T>(values: T[]) {
  return [...new Set(values)];
}

export function buildSourceContext(input: {
  sourceText?: string;
  lessonPrompt: string;
  outlineTitle?: string;
  outlineGoal?: string;
  maxExcerptLength?: number;
}): SourceContext | undefined {
  if (!input.sourceText?.trim()) {
    return undefined;
  }

  const paragraphs = splitIntoParagraphs(input.sourceText);
  if (paragraphs.length === 0) {
    return undefined;
  }

  const queryTokens = unique(
    tokenize(`${input.lessonPrompt} ${input.outlineTitle ?? ""} ${input.outlineGoal ?? ""}`),
  );

  const ranked = paragraphs
    .map((paragraph) => {
      const paragraphTokens = tokenize(paragraph);
      const overlap = queryTokens.filter((token) => paragraphTokens.includes(token));
      return {
        paragraph,
        overlap,
        score: overlap.length,
      };
    })
    .sort((left, right) => right.score - left.score || left.paragraph.length - right.paragraph.length);

  const chosen = ranked.filter((item) => item.score > 0).slice(0, 2);
  const fallback = chosen.length > 0 ? chosen : ranked.slice(0, 1);
  const maxExcerptLength = input.maxExcerptLength ?? 420;
  const excerpt = normalizeWhitespace(
    fallback.map((item) => item.paragraph).join(" ").slice(0, maxExcerptLength),
  );

  if (!excerpt) {
    return undefined;
  }

  const topHighlights = unique(fallback.flatMap((item) => item.overlap).slice(0, 5));
  const focusTopic = input.outlineTitle ?? input.lessonPrompt;
  const rationale =
    topHighlights.length > 0
      ? `Chosen because it overlaps with "${focusTopic}" through ${topHighlights.join(", ")}.`
      : `Chosen as the clearest available source support for "${focusTopic}".`;

  return {
    excerpt,
    highlights: topHighlights,
    rationale,
    emphasisLabel: topHighlights.length > 0 ? "Matched source terms" : "Source support",
  };
}

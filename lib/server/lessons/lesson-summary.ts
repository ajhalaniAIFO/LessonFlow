import type { Lesson } from "@/types/lesson";

export type LessonExportFormat = "markdown" | "html" | "json";

function uniqueTakeaways(lesson: Lesson) {
  const takeaways = lesson.scenes.flatMap((scene) => {
    if (!scene.content || !("keyTakeaways" in scene.content) || !scene.content.keyTakeaways) {
      return [];
    }

    return scene.content.keyTakeaways;
  });

  return [...new Set(takeaways)];
}

function slugifyLessonTitle(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "lesson";
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

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
    lines.push(`- ${item.order}. ${item.title}${item.goal ? ` - ${item.goal}` : ""}`);
  });
  lines.push("");

  lines.push("## Key Takeaways");
  const takeaways = uniqueTakeaways(lesson);

  if (takeaways.length === 0) {
    lines.push("- No lesson takeaways were generated yet.");
  } else {
    takeaways.forEach((takeaway) => {
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

function buildLessonHtml(lesson: Lesson) {
  const takeaways = uniqueTakeaways(lesson);

  const outlineItems = lesson.outline
    .map(
      (item) =>
        `<li><strong>${escapeHtml(item.title)}</strong>${
          item.goal ? ` <span>- ${escapeHtml(item.goal)}</span>` : ""
        } <em>(${escapeHtml(item.sceneType)})</em></li>`,
    )
    .join("");

  const takeawayItems = takeaways.length
    ? takeaways.map((takeaway) => `<li>${escapeHtml(takeaway)}</li>`).join("")
    : "<li>No lesson takeaways were generated yet.</li>";

  const sceneBlocks = lesson.scenes
    .map((scene) => {
      if (scene.content && "summary" in scene.content) {
        const sections = scene.content.sections
          .map((section) => {
            const bullets = section.bullets?.length
              ? `<ul>${section.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join("")}</ul>`
              : "";

            return `
              <section class="scene-section">
                <h4>${escapeHtml(section.heading)}</h4>
                <p>${escapeHtml(section.body)}</p>
                ${bullets}
              </section>
            `;
          })
          .join("");

        const sceneTakeaways = scene.content.keyTakeaways?.length
          ? `<ul>${scene.content.keyTakeaways
              .map((takeaway) => `<li>${escapeHtml(takeaway)}</li>`)
              .join("")}</ul>`
          : "";

        return `
          <article class="scene-card">
            <p class="scene-meta">Scene ${scene.order} • Teaching scene</p>
            <h3>${escapeHtml(scene.title)}</h3>
            <p>${escapeHtml(scene.content.summary)}</p>
            ${sections}
            ${sceneTakeaways ? `<div><strong>Key takeaways</strong>${sceneTakeaways}</div>` : ""}
          </article>
        `;
      }

      if (scene.content && "questions" in scene.content) {
        const questions = scene.content.questions
          .map(
            (question, index) => `
              <li>
                <strong>Quiz ${index + 1}:</strong> ${escapeHtml(question.prompt)}
              </li>
            `,
          )
          .join("");

        return `
          <article class="scene-card">
            <p class="scene-meta">Scene ${scene.order} • Quiz scene</p>
            <h3>${escapeHtml(scene.title)}</h3>
            <ul>${questions}</ul>
          </article>
        `;
      }

      return `
        <article class="scene-card">
          <p class="scene-meta">Scene ${scene.order}</p>
          <h3>${escapeHtml(scene.title)}</h3>
          <p>No scene content available.</p>
        </article>
      `;
    })
    .join("");

  return `<!doctype html>
<html lang="${escapeHtml(lesson.language)}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(lesson.title)} - LessonFlow Export</title>
    <style>
      :root {
        color-scheme: light;
        --ink: #16213e;
        --muted: #5b6780;
        --line: #d5def0;
        --surface: #ffffff;
        --surface-soft: #f4f7fd;
        --accent: #2f5fe3;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: "Segoe UI", sans-serif;
        color: var(--ink);
        background: linear-gradient(180deg, #edf3ff 0%, #f9fbff 100%);
      }
      main {
        max-width: 960px;
        margin: 0 auto;
        padding: 48px 24px 72px;
      }
      .hero, .card, .scene-card {
        background: var(--surface);
        border: 1px solid var(--line);
        border-radius: 20px;
        box-shadow: 0 18px 45px rgba(28, 45, 90, 0.08);
      }
      .hero, .card {
        padding: 28px;
        margin-bottom: 20px;
      }
      .eyebrow, .scene-meta {
        color: var(--accent);
        font-size: 0.85rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }
      h1, h2, h3, h4 { margin-top: 0; }
      p, li, span, em { color: var(--muted); line-height: 1.6; }
      ul, ol { padding-left: 22px; }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 20px;
      }
      .scene-list {
        display: grid;
        gap: 18px;
      }
      .scene-card {
        padding: 24px;
      }
      .scene-section {
        margin-top: 18px;
        padding-top: 18px;
        border-top: 1px solid var(--line);
      }
      @media (max-width: 720px) {
        main { padding: 24px 16px 40px; }
      }
    </style>
  </head>
  <body>
    <main>
      <section class="hero">
        <p class="eyebrow">LessonFlow Export</p>
        <h1>${escapeHtml(lesson.title)}</h1>
        <p>${escapeHtml(lesson.prompt ?? "This lesson was generated from your uploaded material.")}</p>
      </section>
      <section class="grid">
        <section class="card">
          <h2>Outline</h2>
          <ol>${outlineItems}</ol>
        </section>
        <section class="card">
          <h2>Key takeaways</h2>
          <ul>${takeawayItems}</ul>
        </section>
      </section>
      <section class="card">
        <h2>Scene summaries</h2>
        <div class="scene-list">${sceneBlocks}</div>
      </section>
    </main>
  </body>
</html>`;
}

function buildLessonJson(lesson: Lesson) {
  return JSON.stringify(
    {
      title: lesson.title,
      prompt: lesson.prompt ?? null,
      language: lesson.language,
      sourceType: lesson.sourceType,
      outline: lesson.outline,
      scenes: lesson.scenes,
      takeaways: uniqueTakeaways(lesson),
    },
    null,
    2,
  );
}

export function buildLessonExport(lesson: Lesson, format: LessonExportFormat) {
  const slug = slugifyLessonTitle(lesson.title);

  if (format === "html") {
    return {
      content: buildLessonHtml(lesson),
      mimeType: "text/html;charset=utf-8",
      extension: "html",
      filename: `${slug}-lesson.html`,
    };
  }

  if (format === "json") {
    return {
      content: buildLessonJson(lesson),
      mimeType: "application/json;charset=utf-8",
      extension: "json",
      filename: `${slug}-lesson.json`,
    };
  }

  return {
    content: buildLessonSummary(lesson),
    mimeType: "text/markdown;charset=utf-8",
    extension: "md",
    filename: `${slug}-summary.md`,
  };
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

import Link from "next/link";
import { QuizSceneClient } from "@/components/lesson/quiz-scene-client";
import { getLessonById } from "@/lib/server/lessons/lesson-service";

export const dynamic = "force-dynamic";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  const lesson = await getLessonById(lessonId);

  if (!lesson) {
    return (
      <main className="page-shell">
        <p>Lesson not found.</p>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <nav className="nav">
        <div>
          <strong>LessonFlow</strong>
        </div>
        <div className="nav-links">
          <Link className="nav-link" href="/">
            Home
          </Link>
          <Link className="nav-link" href="/settings">
            Settings
          </Link>
        </div>
      </nav>

      <section className="hero">
        <span className="eyebrow">Outline Ready</span>
        <h1>{lesson.title}</h1>
        <p>{lesson.prompt}</p>
      </section>

      <section className="card">
        <h2>Generated outline</h2>
        <ol className="step-list">
          {lesson.outline.map((item) => (
            <li key={item.id}>
              <strong>{item.title}</strong>
              {item.goal ? ` - ${item.goal}` : ""}
              {` (${item.sceneType})`}
            </li>
          ))}
        </ol>
      </section>

      <section className="card">
        <h2>Generated scenes</h2>
        {lesson.scenes.length === 0 ? (
          <p>No scene content has been generated yet.</p>
        ) : (
          lesson.scenes.map((scene) => (
            <article key={scene.id} style={{ marginBottom: "20px" }}>
              <h3>{scene.title}</h3>
              {"content" in scene && scene.content && "summary" in scene.content ? (
                <>
                  <p>{scene.content.summary}</p>
                  {scene.content.sections.map((section) => (
                    <div key={section.heading} style={{ marginBottom: "16px" }}>
                      <strong>{section.heading}</strong>
                      <p>{section.body}</p>
                      {section.bullets?.length ? (
                        <ul className="meta-list">
                          {section.bullets.map((bullet) => (
                            <li key={bullet}>{bullet}</li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  ))}
                  {scene.content.keyTakeaways?.length ? (
                    <>
                      <strong>Key takeaways</strong>
                      <ul className="meta-list">
                        {scene.content.keyTakeaways.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                </>
              ) : scene.content && "questions" in scene.content ? (
                <QuizSceneClient
                  lessonId={lesson.id}
                  sceneId={scene.id}
                  title={scene.title}
                  content={scene.content}
                />
              ) : (
                <p>Scene content is not available yet.</p>
              )}
            </article>
          ))
        )}
      </section>
    </main>
  );
}

import Link from "next/link";
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
    </main>
  );
}

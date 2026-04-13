import Link from "next/link";
import { OutlineReviewClient } from "@/components/lesson/outline-review-client";
import { getLessonById } from "@/lib/server/lessons/lesson-service";

export const dynamic = "force-dynamic";

export default async function LessonOutlineReviewPage({
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

      <OutlineReviewClient lesson={lesson} />
    </main>
  );
}

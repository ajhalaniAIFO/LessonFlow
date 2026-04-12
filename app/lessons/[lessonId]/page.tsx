import Link from "next/link";
import { LessonSummaryActions } from "@/components/lesson/lesson-summary-actions";
import { QuizSceneClient } from "@/components/lesson/quiz-scene-client";
import { RegenerateLessonButton } from "@/components/lesson/regenerate-lesson-button";
import { SceneProgressTracker } from "@/components/lesson/scene-progress-tracker";
import { TutorChatClient } from "@/components/lesson/tutor-chat-client";
import {
  getSceneProgressLabel,
  resolveSceneIndex,
} from "@/lib/server/lessons/scene-navigation";
import { getLessonById } from "@/lib/server/lessons/lesson-service";

export const dynamic = "force-dynamic";

export default async function LessonPage({
  params,
  searchParams,
}: {
  params: Promise<{ lessonId: string }>;
  searchParams: Promise<{ scene?: string }>;
}) {
  const { lessonId } = await params;
  const { scene: rawScene } = await searchParams;
  const lesson = await getLessonById(lessonId);

  if (!lesson) {
    return (
      <main className="page-shell">
        <p>Lesson not found.</p>
      </main>
    );
  }

  const activeSceneIndex = resolveSceneIndex(rawScene, lesson.scenes.length);
  const activeScene = activeSceneIndex >= 0 ? lesson.scenes[activeSceneIndex] : null;
  const activeSceneStep = activeSceneIndex + 1;

  return (
    <main className="page-shell">
      {activeSceneStep > 0 ? (
        <SceneProgressTracker lessonId={lesson.id} sceneOrder={activeSceneStep} />
      ) : null}

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
        <span className="eyebrow">Lesson Ready</span>
        <h1>{lesson.title}</h1>
        <p>{lesson.prompt ?? "This lesson was generated from your uploaded material."}</p>
        <div className="button-row">
          <RegenerateLessonButton lessonId={lesson.id} variant="primary" />
        </div>
      </section>

      <section className="card">
        <h2>Lesson summary</h2>
        <p className="status-copy">
          Copy or download a compact markdown summary of this lesson for notes, sharing, or review.
        </p>
        <LessonSummaryActions lessonId={lesson.id} lessonTitle={lesson.title} />
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

      <section className="lesson-layout">
        <aside className="card scene-sidebar">
          <h2>Lesson path</h2>
          <p>
            {lesson.scenes.length} scene{lesson.scenes.length === 1 ? "" : "s"} generated from{" "}
            {lesson.outline.length} outline item{lesson.outline.length === 1 ? "" : "s"}.
          </p>
          {lesson.scenes.length === 0 ? (
            <p>No scene content has been generated yet.</p>
          ) : (
            <ol className="scene-step-list">
              {lesson.scenes.map((scene, index) => (
                <li key={scene.id}>
                  <Link
                    className={`scene-step-link ${index === activeSceneIndex ? "active" : ""}`}
                    href={`/lessons/${lesson.id}?scene=${index + 1}`}
                  >
                    <span className="scene-step-order">{index + 1}</span>
                    <span>
                      <strong>{scene.title}</strong>
                      <small>{scene.type === "lesson" ? "Teaching scene" : "Quiz scene"}</small>
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </aside>

        <section className="card scene-stage">
          <h2>Current scene</h2>
          {activeScene ? (
            <>
              <span className="eyebrow">{getSceneProgressLabel(activeSceneIndex, lesson.scenes)}</span>
              <article className="scene-article">
                <h3>{activeScene.title}</h3>
                {"content" in activeScene && activeScene.content && "summary" in activeScene.content ? (
                  <>
                    <p>{activeScene.content.summary}</p>
                    {activeScene.content.sections.map((section) => (
                      <div key={section.heading} className="scene-section">
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
                    {activeScene.content.keyTakeaways?.length ? (
                      <>
                        <strong>Key takeaways</strong>
                        <ul className="meta-list">
                          {activeScene.content.keyTakeaways.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </>
                    ) : null}
                  </>
                ) : activeScene.content && "questions" in activeScene.content ? (
                  <QuizSceneClient
                    lessonId={lesson.id}
                    sceneId={activeScene.id}
                    title={activeScene.title}
                    content={activeScene.content}
                  />
                ) : (
                  <p>Scene content is not available yet.</p>
                )}
              </article>

              <div className="button-row">
                <Link
                  className="button secondary scene-nav-link"
                  aria-disabled={activeSceneIndex <= 0}
                  href={`/lessons/${lesson.id}?scene=${Math.max(activeSceneStep - 1, 1)}`}
                >
                  Previous scene
                </Link>
                <Link
                  className="button primary scene-nav-link"
                  aria-disabled={activeSceneIndex >= lesson.scenes.length - 1}
                  href={`/lessons/${lesson.id}?scene=${Math.min(activeSceneStep + 1, lesson.scenes.length)}`}
                >
                  Next scene
                </Link>
              </div>
            </>
          ) : (
            <p>No scene content has been generated yet.</p>
          )}
        </section>
      </section>

      <TutorChatClient
        lessonId={lesson.id}
        scenes={lesson.scenes.map((scene) => ({
          id: scene.id,
          title: scene.title,
          type: scene.type,
        }))}
        activeSceneId={activeScene?.id}
      />
    </main>
  );
}

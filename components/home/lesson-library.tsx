"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { RegenerateLessonButton } from "@/components/lesson/regenerate-lesson-button";
import type { ApiResponse } from "@/types/api";
import type { LessonListItem } from "@/types/lesson";

type Props = {
  lessons: LessonListItem[];
};

export function LessonLibrary({ lessons: initialLessons }: Props) {
  const router = useRouter();
  const [lessons, setLessons] = useState(initialLessons);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(lessonId: string) {
    setError(null);
    const response = await fetch(`/api/lessons/${lessonId}`, {
      method: "DELETE",
    });
    const payload = (await response.json()) as ApiResponse<{ successMessage: string }>;

    if (!payload.success) {
      setError(payload.error.message);
      return;
    }

    setLessons((current) => current.filter((lesson) => lesson.id !== lessonId));
    router.refresh();
  }

  async function handleRename(lessonId: string) {
    setError(null);
    const response = await fetch(`/api/lessons/${lessonId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: draftTitle,
      }),
    });
    const payload = (await response.json()) as ApiResponse<{ successMessage: string }>;

    if (!payload.success) {
      setError(payload.error.message);
      return;
    }

    setLessons((current) =>
      current.map((lesson) =>
        lesson.id === lessonId ? { ...lesson, title: draftTitle.trim() } : lesson,
      ),
    );
    setRenamingId(null);
    setDraftTitle("");
    router.refresh();
  }

  return (
    <article className="card">
      <h2>Lesson library</h2>
      {lessons.length === 0 ? (
        <p className="field-hint">Generate your first lesson to start building a reusable library.</p>
      ) : (
        <div className="form-grid">
          {lessons.map((lesson) => (
            <div
              key={lesson.id}
              className={`status-box ${lesson.status === "error" ? "error" : lesson.status === "ready" ? "success" : ""}`}
            >
              {renamingId === lesson.id ? (
                <div className="form-grid">
                  <div className="field">
                    <label htmlFor={`rename-${lesson.id}`}>Rename lesson</label>
                    <input
                      id={`rename-${lesson.id}`}
                      value={draftTitle}
                      onChange={(event) => setDraftTitle(event.target.value)}
                    />
                  </div>
                  <div className="button-row">
                    <button className="button primary" type="button" onClick={() => handleRename(lesson.id)}>
                      Save
                    </button>
                    <button
                      className="button secondary"
                      type="button"
                      onClick={() => {
                        setRenamingId(null);
                        setDraftTitle("");
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="status-title">{lesson.title}</p>
                  <p className="status-copy">
                    Status: {lesson.status} | Mode: {lesson.generationMode} | Level: {lesson.learnerLevel} | Style: {lesson.teachingStyle} | Format: {lesson.lessonFormat} | Scenes: {lesson.sceneCount} | Updated:{" "}
                    {new Date(lesson.updatedAt).toLocaleString()}
                  </p>
                  {lesson.status === "error" ? (
                    <p className="field-hint">This lesson needs regeneration before it will be usable again.</p>
                  ) : null}
                  {lesson.lastViewedSceneOrder ? (
                    <p className="field-hint">Resume from scene {lesson.lastViewedSceneOrder}</p>
                  ) : null}
                  <div className="button-row">
                    <Link
                      className="button primary"
                      href={`/lessons/${lesson.id}${
                        lesson.lastViewedSceneOrder ? `?scene=${lesson.lastViewedSceneOrder}` : ""
                      }`}
                    >
                      Open lesson
                    </Link>
                    <RegenerateLessonButton lessonId={lesson.id} />
                    <button
                      className="button secondary"
                      type="button"
                      onClick={() => {
                        setRenamingId(lesson.id);
                        setDraftTitle(lesson.title);
                      }}
                    >
                      Rename
                    </button>
                    <button className="button secondary" type="button" onClick={() => handleDelete(lesson.id)}>
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {error ? (
        <div className="status-box error">
          <p className="status-title">Lesson library action failed</p>
          <p className="status-copy">{error}</p>
        </div>
      ) : null}
    </article>
  );
}

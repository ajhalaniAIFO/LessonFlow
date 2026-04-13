"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { ApiResponse } from "@/types/api";
import type { Lesson, OutlineReviewUpdate } from "@/types/lesson";

type Props = {
  lesson: Lesson;
};

export function OutlineReviewClient({ lesson }: Props) {
  const router = useRouter();
  const [lessonTitle, setLessonTitle] = useState(lesson.title);
  const [items, setItems] = useState(
    lesson.outline.map((item) => ({
      id: item.id,
      title: item.title,
      goal: item.goal ?? "",
      sceneType: item.sceneType,
      order: item.order,
    })),
  );
  const [status, setStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isContinuing, setIsContinuing] = useState(false);

  const sceneCounts = useMemo(() => {
    const lessonCount = items.filter((item) => item.sceneType === "lesson").length;
    const quizCount = items.filter((item) => item.sceneType === "quiz").length;
    return { lessonCount, quizCount };
  }, [items]);

  async function saveOutline() {
    setIsSaving(true);
    setStatus(null);

    const payload: OutlineReviewUpdate = {
      lessonTitle,
      items: items.map((item) => ({
        id: item.id,
        title: item.title,
        goal: item.goal || undefined,
      })),
    };

    const response = await fetch(`/api/lessons/${lesson.id}/outline`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const result = (await response.json()) as ApiResponse<Lesson | null>;

    setIsSaving(false);

    if (!result.success) {
      setStatus(result.error.message);
      return false;
    }

    setStatus("Outline saved locally.");
    return true;
  }

  async function continueGeneration() {
    setIsContinuing(true);
    setStatus(null);

    const saved = await saveOutline();
    if (!saved) {
      setIsContinuing(false);
      return;
    }

    const response = await fetch(`/api/lessons/${lesson.id}/outline/confirm`, {
      method: "POST",
    });
    const result = (await response.json()) as ApiResponse<{ lessonId: string; jobId: string }>;

    setIsContinuing(false);

    if (!result.success) {
      setStatus(result.error.message);
      return;
    }

    router.push(`/generate/${result.data.jobId}`);
  }

  return (
    <>
      <section className="hero">
        <span className="eyebrow">Outline Review</span>
        <h1>{lessonTitle}</h1>
        <p>
          Review the lesson plan before we spend local compute generating scenes. You can tune the
          teaching sequence here and then continue when it looks right.
        </p>
        {lesson.status === "draft" && lesson.scenes.length > 0 ? (
          <div className="status-box">
            <p className="status-title">Regeneration review</p>
            <p className="status-copy">
              This outline came from an existing lesson regeneration. The current lesson content will
              be replaced after you continue.
            </p>
          </div>
        ) : null}
      </section>

      <section className="card-grid">
        <section className="card">
          <h2>Lesson setup</h2>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="outline-lesson-title">Lesson title</label>
              <input
                id="outline-lesson-title"
                value={lessonTitle}
                onChange={(event) => setLessonTitle(event.target.value)}
              />
            </div>
            <div className="status-box">
              <p className="status-title">Plan snapshot</p>
              <p className="status-copy">
                {sceneCounts.lessonCount} lesson scene{sceneCounts.lessonCount === 1 ? "" : "s"} and{" "}
                {sceneCounts.quizCount} quiz scene{sceneCounts.quizCount === 1 ? "" : "s"}.
              </p>
            </div>
          </div>
        </section>

        <section className="card">
          <h2>Source grounding</h2>
          <p className="status-copy">
            {lesson.prompt ?? "This outline was created from your uploaded material."}
          </p>
        </section>
      </section>

      <section className="card">
        <h2>Outline items</h2>
        <div className="outline-review-list">
          {items.map((item, index) => (
            <div key={item.id} className="outline-review-item">
              <div className="outline-review-order">{index + 1}</div>
              <div className="outline-review-fields">
                <div className="field">
                  <label htmlFor={`outline-title-${item.id}`}>Section title</label>
                  <input
                    id={`outline-title-${item.id}`}
                    value={item.title}
                    onChange={(event) =>
                      setItems((current) =>
                        current.map((entry) =>
                          entry.id === item.id ? { ...entry, title: event.target.value } : entry,
                        ),
                      )
                    }
                  />
                </div>
                <div className="field">
                  <label htmlFor={`outline-goal-${item.id}`}>Goal</label>
                  <input
                    id={`outline-goal-${item.id}`}
                    value={item.goal}
                    onChange={(event) =>
                      setItems((current) =>
                        current.map((entry) =>
                          entry.id === item.id ? { ...entry, goal: event.target.value } : entry,
                        ),
                      )
                    }
                  />
                </div>
                <p className="status-copy">
                  {item.sceneType === "lesson" ? "Teaching scene" : "Quiz scene"}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="button-row">
          <button
            className="button secondary"
            type="button"
            disabled={isSaving || isContinuing}
            onClick={() => {
              void saveOutline();
            }}
          >
            {isSaving ? "Saving..." : "Save outline"}
          </button>
          <button
            className="button primary"
            type="button"
            disabled={isSaving || isContinuing}
            onClick={() => {
              void continueGeneration();
            }}
          >
            {isContinuing ? "Continuing..." : "Continue to scene generation"}
          </button>
        </div>

        {status ? (
          <div className={`status-box ${status.includes("saved") ? "success" : "error"}`}>
            <p className="status-title">{status.includes("saved") ? "Outline updated" : "Action blocked"}</p>
            <p className="status-copy">{status}</p>
          </div>
        ) : null}
      </section>
    </>
  );
}

"use client";

import { useState } from "react";
import type { LessonFormat } from "@/types/lesson";
import type { InteractiveBlockKind } from "@/types/scene";

type Props = {
  lessonId: string;
  sceneId: string;
  blockKind: InteractiveBlockKind;
  lessonFormat: LessonFormat;
  title: string;
  prompt: string;
  items: string[];
  initialCompleted: boolean;
  listType: "ordered" | "unordered";
};

export function InteractiveBlockCard({
  lessonId,
  sceneId,
  blockKind,
  lessonFormat,
  title,
  prompt,
  items,
  initialCompleted,
  listType,
}: Props) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle() {
    const nextCompleted = !completed;
    setIsSaving(true);
    setError(null);

    const response = await fetch(
      `/api/lessons/${lessonId}/scenes/${sceneId}/interactive-block-progress`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          blockKind,
          completed: nextCompleted,
        }),
      },
    );

    const payload = (await response.json()) as {
      success: boolean;
      error?: {
        message: string;
      };
    };

    setIsSaving(false);

    if (!payload.success) {
      setError(payload.error?.message ?? "Unable to save interactive progress.");
      return;
    }

    setCompleted(nextCompleted);
  }

  const ListTag = listType === "ordered" ? "ol" : "ul";

  return (
    <div className={`interactive-format-card ${lessonFormat} ${completed ? "complete" : ""}`}>
      <div className="interactive-format-header">
        <div>
          <p className="interactive-format-title">{title}</p>
          <p className="status-copy">{prompt}</p>
        </div>
        <button className="button secondary" type="button" onClick={handleToggle} disabled={isSaving}>
          {isSaving ? "Saving..." : completed ? "Mark incomplete" : "Mark complete"}
        </button>
      </div>

      <ListTag className={`${listType === "ordered" ? "step-list" : "meta-list"} interactive-format-list`}>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ListTag>

      <div className={`status-box ${completed ? "success" : ""}`}>
        <p className="status-title">{completed ? "Completed" : "In progress"}</p>
        <p className="status-copy">
          {completed
            ? "This block is saved as done for this lesson."
            : "Mark this block complete when you are ready to move on."}
        </p>
      </div>

      {error ? (
        <div className="status-box error">
          <p className="status-title">Unable to save progress</p>
          <p className="status-copy">{error}</p>
        </div>
      ) : null}
    </div>
  );
}

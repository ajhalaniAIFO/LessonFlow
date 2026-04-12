"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ApiResponse } from "@/types/api";
import type { Lesson } from "@/types/lesson";

type Props = {
  lessonId: string;
  sceneId: string;
};

type ResponseData = {
  lesson: Lesson | null;
};

export function RegenerateSceneButton({ lessonId, sceneId }: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setIsSubmitting(true);
    setError(null);

    const response = await fetch(`/api/lessons/${lessonId}/scenes/${sceneId}/regenerate`, {
      method: "POST",
    });
    const payload = (await response.json()) as ApiResponse<ResponseData>;
    setIsSubmitting(false);

    if (!payload.success) {
      setError(payload.error.message);
      return;
    }

    router.refresh();
  }

  return (
    <div className="form-grid">
      <button className="button secondary" type="button" onClick={handleClick} disabled={isSubmitting}>
        {isSubmitting ? "Refreshing scene..." : "Regenerate scene"}
      </button>
      {error ? (
        <div className="status-box error">
          <p className="status-title">Unable to regenerate scene</p>
          <p className="status-copy">{error}</p>
        </div>
      ) : null}
    </div>
  );
}

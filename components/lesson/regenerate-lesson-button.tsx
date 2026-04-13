"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ApiResponse } from "@/types/api";

type Props = {
  lessonId: string;
  variant?: "primary" | "secondary";
  label?: string;
};

type RegenerateResponse = {
  lessonId: string;
  jobId: string;
};

export function RegenerateLessonButton({
  lessonId,
  variant = "secondary",
  label = "Regenerate",
}: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRegenerate() {
    setIsSubmitting(true);
    setError(null);

    const response = await fetch(`/api/lessons/${lessonId}/regenerate`, {
      method: "POST",
    });
    const payload = (await response.json()) as ApiResponse<RegenerateResponse>;
    setIsSubmitting(false);

    if (!payload.success) {
      setError(payload.error.message);
      return;
    }

    router.push(`/lessons/${payload.data.lessonId}/outline`);
    router.refresh();
  }

  return (
    <>
      <button className={`button ${variant}`} type="button" onClick={handleRegenerate} disabled={isSubmitting}>
        {isSubmitting ? "Preparing review..." : label}
      </button>
      {error ? (
        <div className="status-box error">
          <p className="status-title">Unable to regenerate lesson</p>
          <p className="status-copy">{error}</p>
        </div>
      ) : null}
    </>
  );
}

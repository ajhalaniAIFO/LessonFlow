"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ApiResponse } from "@/types/api";

type CreateLessonResult = {
  lessonId: string;
  jobId: string;
};

export function LessonRequestForm() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [language, setLanguage] = useState("en");
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setIsSubmitting(true);
    setStatus(null);

    const response = await fetch("/api/lessons", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        language,
      }),
    });
    const payload = (await response.json()) as ApiResponse<CreateLessonResult>;
    setIsSubmitting(false);

    if (!payload.success) {
      setStatus(payload.error.message);
      return;
    }

    router.push(`/generate/${payload.data.jobId}`);
  }

  return (
    <div className="form-grid">
      <div className="field">
        <label htmlFor="lesson-prompt">Learning request</label>
        <textarea
          id="lesson-prompt"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          rows={6}
          style={{
            width: "100%",
            padding: "12px 14px",
            borderRadius: "14px",
            border: "1px solid var(--border)",
            resize: "vertical",
          }}
          placeholder="Teach me the basics of thermodynamics with one quick quiz near the end."
        />
      </div>

      <div className="field">
        <label htmlFor="lesson-language">Language</label>
        <select
          id="lesson-language"
          value={language}
          onChange={(event) => setLanguage(event.target.value)}
        >
          <option value="en">English</option>
        </select>
      </div>

      <div className="button-row">
        <button
          className="button primary"
          type="button"
          disabled={isSubmitting || prompt.trim().length === 0}
          onClick={handleSubmit}
        >
          {isSubmitting ? "Creating..." : "Generate lesson outline"}
        </button>
      </div>

      {status ? (
        <div className="status-box error">
          <p className="status-title">Generation blocked</p>
          <p className="status-copy">{status}</p>
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { useState } from "react";
import type { ApiResponse } from "@/types/api";

type Props = {
  lessonId: string;
  lessonTitle: string;
};

type SummaryResponse = {
  markdown: string;
};

export function LessonSummaryActions({ lessonId, lessonTitle }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchSummary() {
    const response = await fetch(`/api/lessons/${lessonId}/summary`, {
      cache: "no-store",
    });
    const payload = (await response.json()) as ApiResponse<SummaryResponse>;

    if (!payload.success) {
      throw new Error(payload.error.message);
    }

    return payload.data.markdown;
  }

  async function handleCopy() {
    try {
      setIsLoading(true);
      setError(null);
      const markdown = await fetchSummary();
      await navigator.clipboard.writeText(markdown);
    } catch (copyError) {
      setError(copyError instanceof Error ? copyError.message : "Unable to copy lesson summary.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDownload() {
    try {
      setIsLoading(true);
      setError(null);
      const markdown = await fetchSummary();
      const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${lessonTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "lesson"}-summary.md`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : "Unable to download lesson summary.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="form-grid">
      <div className="button-row">
        <button className="button secondary" type="button" onClick={handleCopy} disabled={isLoading}>
          {isLoading ? "Preparing..." : "Copy summary"}
        </button>
        <button className="button secondary" type="button" onClick={handleDownload} disabled={isLoading}>
          {isLoading ? "Preparing..." : "Download summary"}
        </button>
      </div>

      {error ? (
        <div className="status-box error">
          <p className="status-title">Summary export failed</p>
          <p className="status-copy">{error}</p>
        </div>
      ) : null}
    </div>
  );
}

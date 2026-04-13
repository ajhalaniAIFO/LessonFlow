"use client";

import { useState } from "react";
import type { ApiResponse } from "@/types/api";
import type { LessonExportFormat } from "@/lib/server/lessons/lesson-summary";

type Props = {
  lessonId: string;
  lessonTitle: string;
};

type SummaryResponse = {
  format: LessonExportFormat;
  content: string;
  mimeType: string;
  filename: string;
};

export function LessonSummaryActions({ lessonId, lessonTitle }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchSummary(format: LessonExportFormat) {
    const response = await fetch(`/api/lessons/${lessonId}/summary?format=${format}`, {
      cache: "no-store",
    });
    const payload = (await response.json()) as ApiResponse<SummaryResponse>;

    if (!payload.success) {
      throw new Error(payload.error.message);
    }

    return payload.data;
  }

  async function handleCopy() {
    try {
      setIsLoading(true);
      setError(null);
      const exported = await fetchSummary("markdown");
      await navigator.clipboard.writeText(exported.content);
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
      const exported = await fetchSummary("markdown");
      const blob = new Blob([exported.content], { type: exported.mimeType });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = exported.filename;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : "Unable to download lesson summary.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleFormatDownload(format: LessonExportFormat) {
    try {
      setIsLoading(true);
      setError(null);
      const exported = await fetchSummary(format);
      const blob = new Blob([exported.content], { type: exported.mimeType });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = exported.filename;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : "Unable to download lesson export.");
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
          {isLoading ? "Preparing..." : "Download markdown"}
        </button>
        <button
          className="button secondary"
          type="button"
          onClick={() => {
            void handleFormatDownload("html");
          }}
          disabled={isLoading}
        >
          {isLoading ? "Preparing..." : "Download web page"}
        </button>
        <button
          className="button secondary"
          type="button"
          onClick={() => {
            void handleFormatDownload("json");
          }}
          disabled={isLoading}
        >
          {isLoading ? "Preparing..." : "Download lesson data"}
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

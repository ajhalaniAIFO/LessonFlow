"use client";

import { useState } from "react";

type Props = {
  lessonId: string;
  lessonTitle: string;
  activeSceneId?: string;
};

export function LessonAudioDownloadActions({ lessonId, lessonTitle, activeSceneId }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function downloadAudio(scope: "scene" | "lesson") {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({ scope });
      if (scope === "scene" && activeSceneId) {
        params.set("sceneId", activeSceneId);
      }

      const response = await fetch(`/api/lessons/${lessonId}/audio?${params.toString()}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: { message?: string } };
        throw new Error(payload.error?.message ?? "Unable to download lesson audio.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download =
        scope === "scene"
          ? `${lessonTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "lesson"}-current-scene.wav`
          : `${lessonTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "lesson"}-lesson-audio.wav`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : "Unable to download lesson audio.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="form-grid">
      <div className="button-row">
        <button
          className="button secondary"
          type="button"
          onClick={() => downloadAudio("scene")}
          disabled={isLoading || !activeSceneId}
        >
          {isLoading ? "Preparing..." : "Download current scene audio"}
        </button>
        <button className="button secondary" type="button" onClick={() => downloadAudio("lesson")} disabled={isLoading}>
          {isLoading ? "Preparing..." : "Download full lesson audio"}
        </button>
      </div>

      {error ? (
        <div className="status-box error">
          <p className="status-title">Audio export failed</p>
          <p className="status-copy">{error}</p>
        </div>
      ) : null}
    </div>
  );
}

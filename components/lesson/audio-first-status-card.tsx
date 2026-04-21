"use client";

import { useEffect, useMemo, useState } from "react";
import {
  isLessonAudioResumeTarget,
  LESSON_AUDIO_RESUME_CLEAR_EVENT,
  LESSON_AUDIO_RESUME_SUGGEST_EVENT,
  type LessonAudioResumeTarget,
} from "@/lib/runtime/audio-coordination";
import { getAudioFirstStatus } from "@/lib/runtime/audio-first-polish";
import {
  LESSON_AUDIO_RESUME_STORAGE_KEY,
  parseLessonAudioResume,
} from "@/lib/runtime/audio-resume";

type Props = {
  lessonId: string;
  activeSceneOrder: number;
  totalScenes: number;
  queueLength: number;
};

export function AudioFirstStatusCard({
  lessonId,
  activeSceneOrder,
  totalScenes,
  queueLength,
}: Props) {
  const [resumeTarget, setResumeTarget] = useState<LessonAudioResumeTarget | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const stored = window.localStorage.getItem(LESSON_AUDIO_RESUME_STORAGE_KEY);
      if (stored) {
        const parsed = parseLessonAudioResume(JSON.parse(stored));
        if (parsed?.lessonId === lessonId) {
          setResumeTarget(parsed);
        }
      }
    } catch {
      setResumeTarget(null);
    }

    const handleSuggest = (event: Event) => {
      if (!(event instanceof CustomEvent) || !isLessonAudioResumeTarget(event.detail) || event.detail.lessonId !== lessonId) {
        return;
      }

      setResumeTarget(event.detail);
    };

    const handleClear = () => {
      setResumeTarget(null);
    };

    window.addEventListener(LESSON_AUDIO_RESUME_SUGGEST_EVENT, handleSuggest);
    window.addEventListener(LESSON_AUDIO_RESUME_CLEAR_EVENT, handleClear);

    return () => {
      window.removeEventListener(LESSON_AUDIO_RESUME_SUGGEST_EVENT, handleSuggest);
      window.removeEventListener(LESSON_AUDIO_RESUME_CLEAR_EVENT, handleClear);
    };
  }, [lessonId]);

  const status = useMemo(
    () =>
      getAudioFirstStatus({
        activeSceneOrder,
        totalScenes,
        queueLength,
        resumeTarget,
      }),
    [activeSceneOrder, queueLength, resumeTarget, totalScenes],
  );

  return (
    <section className="card audio-first-status-card">
      <div className="audio-first-status-header">
        <div>
          <p className="status-title">{status.title}</p>
          <p className="status-copy">{status.summary}</p>
        </div>
        <span className={`recommendation-badge ${resumeTarget ? "success" : "info"}`}>
          {status.badgeLabel}
        </span>
      </div>

      <div className="audio-first-status-grid">
        <div className="status-box">
          <p className="status-title">Queue</p>
          <p className="status-copy">{status.queueLabel}</p>
        </div>
        <div className="status-box">
          <p className="status-title">Tutor handoff</p>
          <p className="status-copy">{status.handoffLabel}</p>
        </div>
        <div className="status-box">
          <p className="status-title">Resume</p>
          <p className="status-copy">{status.resumeLabel}</p>
        </div>
      </div>
    </section>
  );
}

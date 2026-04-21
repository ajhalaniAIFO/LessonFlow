"use client";

import { useEffect, useMemo, useState } from "react";
import {
  clearLessonAudioResume,
  isLessonAudioResumeTarget,
  LESSON_AUDIO_RESUME_CLEAR_EVENT,
  LESSON_AUDIO_RESUME_REQUEST_EVENT,
  LESSON_AUDIO_RESUME_SUGGEST_EVENT,
  requestLessonAudioResume,
  type LessonAudioResumeTarget,
} from "@/lib/runtime/audio-coordination";
import {
  describeLessonAudioResume,
  LESSON_AUDIO_RESUME_STORAGE_KEY,
  parseLessonAudioResume,
} from "@/lib/runtime/audio-resume";

type Props = {
  lessonId: string;
};

export function LessonAudioResumeCard({ lessonId }: Props) {
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

  const description = useMemo(
    () => (resumeTarget ? describeLessonAudioResume(resumeTarget) : null),
    [resumeTarget],
  );

  function handleResume() {
    if (typeof window === "undefined" || !resumeTarget) {
      return;
    }

    requestLessonAudioResume(window, resumeTarget);
    window.localStorage.removeItem(LESSON_AUDIO_RESUME_STORAGE_KEY);
    clearLessonAudioResume(window);
  }

  function handleDismiss() {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.removeItem(LESSON_AUDIO_RESUME_STORAGE_KEY);
    clearLessonAudioResume(window);
  }

  if (!resumeTarget || !description) {
    return null;
  }

  return (
    <section className="card lesson-audio-resume-card">
      <div className="lesson-audio-resume-header">
        <div>
          <p className="scene-audio-title">{description.title}</p>
          <p className="status-copy">{description.copy}</p>
        </div>
        <span className="recommendation-badge success">Ready to continue</span>
      </div>
      <div className="button-row">
        <button className="button primary" type="button" onClick={handleResume}>
          {description.actionLabel}
        </button>
        <button className="button secondary" type="button" onClick={handleDismiss}>
          Dismiss
        </button>
      </div>
    </section>
  );
}

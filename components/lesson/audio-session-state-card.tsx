"use client";

import { useEffect, useMemo, useState } from "react";
import {
  isLessonAudioResumeTarget,
  isLessonAudioSessionDetail,
  LESSON_AUDIO_RESUME_CLEAR_EVENT,
  LESSON_AUDIO_RESUME_SUGGEST_EVENT,
  LESSON_AUDIO_SESSION_EVENT,
  type LessonAudioResumeTarget,
  type LessonAudioSessionDetail,
} from "@/lib/runtime/audio-coordination";
import { getAudioSessionState } from "@/lib/runtime/audio-session-state";
import {
  LESSON_AUDIO_RESUME_STORAGE_KEY,
  parseLessonAudioResume,
} from "@/lib/runtime/audio-resume";

type Props = {
  lessonId: string;
};

export function AudioSessionStateCard({ lessonId }: Props) {
  const [session, setSession] = useState<LessonAudioSessionDetail | null>(null);
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

    const handleSession = (event: Event) => {
      if (!(event instanceof CustomEvent) || !isLessonAudioSessionDetail(event.detail) || event.detail.lessonId !== lessonId) {
        return;
      }

      setSession(event.detail);
    };

    const handleSuggest = (event: Event) => {
      if (!(event instanceof CustomEvent) || !isLessonAudioResumeTarget(event.detail) || event.detail.lessonId !== lessonId) {
        return;
      }

      setResumeTarget(event.detail);
    };

    const handleClear = () => {
      setResumeTarget(null);
    };

    window.addEventListener(LESSON_AUDIO_SESSION_EVENT, handleSession);
    window.addEventListener(LESSON_AUDIO_RESUME_SUGGEST_EVENT, handleSuggest);
    window.addEventListener(LESSON_AUDIO_RESUME_CLEAR_EVENT, handleClear);

    return () => {
      window.removeEventListener(LESSON_AUDIO_SESSION_EVENT, handleSession);
      window.removeEventListener(LESSON_AUDIO_RESUME_SUGGEST_EVENT, handleSuggest);
      window.removeEventListener(LESSON_AUDIO_RESUME_CLEAR_EVENT, handleClear);
    };
  }, [lessonId]);

  const state = useMemo(() => getAudioSessionState(session, resumeTarget), [resumeTarget, session]);

  return (
    <section className="card audio-session-state-card">
      <div className="audio-first-status-header">
        <div>
          <p className="status-title">{state.title}</p>
          <p className="status-copy">{state.summary}</p>
        </div>
        <span className={`recommendation-badge ${session && session.owner !== "idle" && session.state !== "idle" ? "info" : resumeTarget ? "success" : "muted"}`}>
          {state.badgeLabel}
        </span>
      </div>

      <div className="audio-first-status-grid">
        <div className="status-box">
          <p className="status-title">Audio owner</p>
          <p className="status-copy">{state.ownerLabel}</p>
        </div>
        <div className="status-box">
          <p className="status-title">Resume state</p>
          <p className="status-copy">{state.resumeLabel}</p>
        </div>
      </div>
    </section>
  );
}

import type { LessonAudioResumeTarget } from "@/lib/runtime/audio-coordination";

export const LESSON_AUDIO_RESUME_STORAGE_KEY = "lessonflow.audioResume";

export function parseLessonAudioResume(value: unknown): LessonAudioResumeTarget | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<LessonAudioResumeTarget>;

  if (
    typeof candidate.lessonId !== "string" ||
    (candidate.source !== "scene" && candidate.source !== "playlist") ||
    typeof candidate.sceneId !== "string" ||
    typeof candidate.sceneOrder !== "number" ||
    typeof candidate.title !== "string" ||
    (candidate.playlistIndex !== undefined && typeof candidate.playlistIndex !== "number")
  ) {
    return null;
  }

  return candidate as LessonAudioResumeTarget;
}

export function serializeLessonAudioResume(value: LessonAudioResumeTarget) {
  return JSON.stringify(value);
}

export function describeLessonAudioResume(value: LessonAudioResumeTarget) {
  if (value.source === "playlist") {
    return {
      title: "Resume lesson listening",
      copy: `Your lesson playlist paused around scene ${value.sceneOrder}: ${value.title}.`,
      actionLabel: "Resume playlist",
    };
  }

  return {
    title: "Resume scene narration",
    copy: `Your scene narration paused at scene ${value.sceneOrder}: ${value.title}.`,
    actionLabel: "Resume scene",
  };
}

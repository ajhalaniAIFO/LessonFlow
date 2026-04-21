export const LESSON_AUDIO_STOP_EVENT = "lessonflow:audio-stop";
export const LESSON_AUDIO_RESUME_SUGGEST_EVENT = "lessonflow:audio-resume-suggest";
export const LESSON_AUDIO_RESUME_REQUEST_EVENT = "lessonflow:audio-resume-request";
export const LESSON_AUDIO_RESUME_CLEAR_EVENT = "lessonflow:audio-resume-clear";

export type LessonAudioSource = "scene" | "playlist" | "tutor-reply" | "tutor-input";
export type LessonAudioReason = "start-playback" | "open-tutor" | "send-question";

export type LessonAudioStopDetail = {
  source: LessonAudioSource;
  reason: LessonAudioReason;
};

export type LessonAudioResumeTarget = {
  lessonId: string;
  source: "scene" | "playlist";
  sceneId: string;
  sceneOrder: number;
  title: string;
  playlistIndex?: number;
};

type CustomEventTarget = {
  dispatchEvent: (event: Event) => boolean;
  CustomEvent: typeof CustomEvent;
};

export function requestLessonAudioStop(
  target: CustomEventTarget,
  detail: LessonAudioStopDetail,
) {
  target.dispatchEvent(new target.CustomEvent<LessonAudioStopDetail>(LESSON_AUDIO_STOP_EVENT, { detail }));
}

export function suggestLessonAudioResume(
  target: CustomEventTarget,
  detail: LessonAudioResumeTarget,
) {
  target.dispatchEvent(
    new target.CustomEvent<LessonAudioResumeTarget>(LESSON_AUDIO_RESUME_SUGGEST_EVENT, { detail }),
  );
}

export function requestLessonAudioResume(
  target: CustomEventTarget,
  detail: LessonAudioResumeTarget,
) {
  target.dispatchEvent(
    new target.CustomEvent<LessonAudioResumeTarget>(LESSON_AUDIO_RESUME_REQUEST_EVENT, { detail }),
  );
}

export function clearLessonAudioResume(target: CustomEventTarget) {
  target.dispatchEvent(new target.CustomEvent(LESSON_AUDIO_RESUME_CLEAR_EVENT));
}

export function isLessonAudioStopDetail(value: unknown): value is LessonAudioStopDetail {
  if (!value || typeof value !== "object") {
    return false;
  }

  const detail = value as Partial<LessonAudioStopDetail>;

  return (
    (detail.source === "scene" ||
      detail.source === "playlist" ||
      detail.source === "tutor-reply" ||
      detail.source === "tutor-input") &&
    (detail.reason === "start-playback" || detail.reason === "open-tutor" || detail.reason === "send-question")
  );
}

export function isLessonAudioResumeTarget(value: unknown): value is LessonAudioResumeTarget {
  if (!value || typeof value !== "object") {
    return false;
  }

  const detail = value as Partial<LessonAudioResumeTarget>;

  return (
    typeof detail.lessonId === "string" &&
    (detail.source === "scene" || detail.source === "playlist") &&
    typeof detail.sceneId === "string" &&
    typeof detail.sceneOrder === "number" &&
    typeof detail.title === "string" &&
    (detail.playlistIndex === undefined || typeof detail.playlistIndex === "number")
  );
}

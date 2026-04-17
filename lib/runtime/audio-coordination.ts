export const LESSON_AUDIO_STOP_EVENT = "lessonflow:audio-stop";

export type LessonAudioSource = "scene" | "playlist" | "tutor-reply" | "tutor-input";
export type LessonAudioReason = "start-playback" | "open-tutor" | "send-question";

export type LessonAudioStopDetail = {
  source: LessonAudioSource;
  reason: LessonAudioReason;
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

export function resolveAudioFirstMode(value: string | undefined) {
  return value === "audio";
}

export function buildLessonSceneHref(lessonId: string, sceneOrder: number, audioMode: boolean) {
  const params = new URLSearchParams({
    scene: String(sceneOrder),
  });

  if (audioMode) {
    params.set("mode", "audio");
  }

  return `/lessons/${lessonId}?${params.toString()}`;
}

export function buildLessonModeHref(lessonId: string, sceneOrder: number, audioMode: boolean) {
  const params = new URLSearchParams({
    scene: String(sceneOrder),
  });

  if (!audioMode) {
    params.set("mode", "audio");
  }

  const query = params.toString();
  return query ? `/lessons/${lessonId}?${query}` : `/lessons/${lessonId}`;
}

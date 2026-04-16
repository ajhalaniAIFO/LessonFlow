import { buildLessonSceneNarration, buildQuizSceneNarration } from "@/lib/server/lessons/scene-audio";
import type { Scene } from "@/types/scene";

export type LessonAudioPlaylistEntry = {
  sceneId: string;
  sceneOrder: number;
  title: string;
  type: Scene["type"];
  text: string;
};

export function buildLessonAudioPlaylist(scenes: Scene[]): LessonAudioPlaylistEntry[] {
  return scenes
    .map((scene, index) => {
      if (!scene.content) {
        return null;
      }

      const text =
        "summary" in scene.content
          ? buildLessonSceneNarration(scene.title, scene.content)
          : buildQuizSceneNarration(scene.title, scene.content);

      if (!text.trim()) {
        return null;
      }

      return {
        sceneId: scene.id,
        sceneOrder: index + 1,
        title: scene.title,
        type: scene.type,
        text,
      } satisfies LessonAudioPlaylistEntry;
    })
    .filter((entry): entry is LessonAudioPlaylistEntry => entry !== null);
}

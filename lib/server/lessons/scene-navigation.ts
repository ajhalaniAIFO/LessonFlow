import type { Scene } from "@/types/scene";

export function resolveSceneIndex(rawScene: string | undefined, sceneCount: number) {
  if (sceneCount <= 0) {
    return -1;
  }

  if (!rawScene) {
    return 0;
  }

  const parsed = Number.parseInt(rawScene, 10);
  if (Number.isNaN(parsed)) {
    return 0;
  }

  return Math.min(Math.max(parsed - 1, 0), sceneCount - 1);
}

export function getSceneProgressLabel(index: number, scenes: Scene[]) {
  if (!scenes.length || index < 0 || index >= scenes.length) {
    return "No scenes available";
  }

  const scene = scenes[index];
  return `Scene ${index + 1} of ${scenes.length}: ${scene.title}`;
}

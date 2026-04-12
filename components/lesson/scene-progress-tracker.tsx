"use client";

import { useEffect } from "react";

type Props = {
  lessonId: string;
  sceneOrder: number;
};

export function SceneProgressTracker({ lessonId, sceneOrder }: Props) {
  useEffect(() => {
    if (sceneOrder < 1) {
      return;
    }

    void fetch(`/api/lessons/${lessonId}/progress`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sceneOrder,
      }),
    });
  }, [lessonId, sceneOrder]);

  return null;
}

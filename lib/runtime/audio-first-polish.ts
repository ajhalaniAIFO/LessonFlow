import type { LessonAudioResumeTarget } from "@/lib/runtime/audio-coordination";

type AudioFirstStatusInput = {
  activeSceneOrder: number;
  totalScenes: number;
  queueLength: number;
  resumeTarget: LessonAudioResumeTarget | null;
};

type AudioFirstStatusModel = {
  badgeLabel: string;
  title: string;
  summary: string;
  queueLabel: string;
  handoffLabel: string;
  resumeLabel: string;
};

export function getAudioFirstStatus({
  activeSceneOrder,
  totalScenes,
  queueLength,
  resumeTarget,
}: AudioFirstStatusInput): AudioFirstStatusModel {
  const queueLabel =
    queueLength > 1
      ? `${queueLength} narratable scenes remain in the queue from here.`
      : "This is the last narratable stop in the queue.";

  if (resumeTarget?.source === "playlist") {
    return {
      badgeLabel: "Resume ready",
      title: "Pick up your lesson playlist",
      summary: `Your listening flow paused near scene ${resumeTarget.sceneOrder}: ${resumeTarget.title}.`,
      queueLabel,
      handoffLabel:
        "Tutor questions and reply playback pause the lesson cleanly, so voices never overlap while you think.",
      resumeLabel: `Use the resume card below to continue the playlist from scene ${resumeTarget.sceneOrder} when you're ready.`,
    };
  }

  if (resumeTarget?.source === "scene") {
    return {
      badgeLabel: "Resume ready",
      title: "Return to this scene quickly",
      summary: `Your scene narration paused at scene ${resumeTarget.sceneOrder}: ${resumeTarget.title}.`,
      queueLabel,
      handoffLabel:
        "Tutor interactions keep lesson audio paused until you explicitly resume, which makes the handoff predictable.",
      resumeLabel: `Use the resume card below to replay scene ${resumeTarget.sceneOrder} without losing your place in audio mode.`,
    };
  }

  return {
    badgeLabel: "Listening mode",
    title: "Audio flow is ready",
    summary: `You are on scene ${activeSceneOrder} of ${totalScenes}, with the listening controls centered on this step.`,
    queueLabel,
    handoffLabel:
      "Opening the tutor pauses lesson playback first, so you can ask or listen back without stacked audio.",
    resumeLabel: "If you pause for the tutor, a manual resume action will stay here so listening never restarts unexpectedly.",
  };
}

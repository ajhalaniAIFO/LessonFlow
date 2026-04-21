import type { LessonAudioResumeTarget } from "@/lib/runtime/audio-coordination";

type AudioFirstReplyResumeModel = {
  title: string;
  summary: string;
  actionLabel: string;
  helperCopy: string;
};

export function getAudioFirstReplyResume(
  resumeTarget: LessonAudioResumeTarget,
): AudioFirstReplyResumeModel {
  if (resumeTarget.source === "playlist") {
    return {
      title: "Tutor reply finished. Return to the lesson queue.",
      summary: `Your tutor reply is done, and the lesson playlist is still waiting near scene ${resumeTarget.sceneOrder}: ${resumeTarget.title}.`,
      actionLabel: "Resume lesson queue",
      helperCopy:
        "This stays manual on purpose, so the lesson only starts speaking again when you explicitly continue.",
    };
  }

  return {
    title: "Tutor reply finished. Return to this scene.",
    summary: `Your tutor reply is done, and scene ${resumeTarget.sceneOrder}: ${resumeTarget.title} is ready to continue.`,
    actionLabel: "Resume this scene",
    helperCopy:
      "This stays manual on purpose, so the scene narration only restarts when you explicitly continue.",
  };
}

import type {
  LessonAudioResumeTarget,
  LessonAudioSessionDetail,
} from "@/lib/runtime/audio-coordination";

type AudioSessionStateModel = {
  badgeLabel: string;
  title: string;
  summary: string;
  ownerLabel: string;
  resumeLabel: string;
};

export function getAudioSessionState(
  session: LessonAudioSessionDetail | null,
  resumeTarget: LessonAudioResumeTarget | null,
): AudioSessionStateModel {
  const resumeLabel = resumeTarget
    ? resumeTarget.source === "playlist"
      ? `Resume is ready for the lesson queue near scene ${resumeTarget.sceneOrder}.`
      : `Resume is ready for scene ${resumeTarget.sceneOrder}.`
    : "No lesson resume target is waiting right now.";

  if (!session || session.owner === "idle" || session.state === "idle") {
    return {
      badgeLabel: resumeTarget ? "Paused" : "Idle",
      title: resumeTarget ? "Lesson audio is paused" : "Audio session is quiet",
      summary: resumeTarget
        ? "The lesson is not speaking right now, and a manual resume is ready when you want to continue."
        : "Nothing currently owns the lesson voice loop.",
      ownerLabel: "No active audio owner",
      resumeLabel,
    };
  }

  if (session.owner === "scene") {
    return {
      badgeLabel: session.state === "paused" ? "Scene paused" : "Scene audio",
      title:
        session.state === "paused"
          ? "Scene narration is paused"
          : `Scene narration is active${session.sceneOrder ? ` on scene ${session.sceneOrder}` : ""}`,
      summary:
        session.state === "paused"
          ? "The current scene still owns audio focus, but narration is paused until you continue it."
          : `The lesson is narrating${session.title ? ` ${session.title}` : " the current scene"} right now.`,
      ownerLabel: session.title ? `Scene narration: ${session.title}` : "Scene narration has audio focus",
      resumeLabel,
    };
  }

  if (session.owner === "playlist") {
    return {
      badgeLabel: "Queue playing",
      title: "Lesson queue is moving",
      summary: session.title
        ? `The lesson playlist is currently narrating scene ${session.sceneOrder ?? "?"}: ${session.title}.`
        : "The lesson playlist currently owns audio focus.",
      ownerLabel: session.title ? `Playlist: ${session.title}` : "Lesson playlist has audio focus",
      resumeLabel,
    };
  }

  if (session.owner === "tutor-input") {
    return {
      badgeLabel: "Tutor listening",
      title: "Tutor voice input has the floor",
      summary: "Lesson playback is paused while voice input is open so you can ask a question without overlapping audio.",
      ownerLabel: "Tutor voice input",
      resumeLabel,
    };
  }

  return {
    badgeLabel: "Tutor speaking",
    title: "Tutor reply playback has the floor",
    summary: session.title
      ? `The tutor is currently reading back a reply about ${session.title}.`
      : "The tutor is currently reading back a reply.",
    ownerLabel: "Tutor reply playback",
    resumeLabel,
  };
}

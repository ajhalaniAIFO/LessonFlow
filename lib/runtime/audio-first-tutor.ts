type AudioFirstTutorStateInput = {
  activeSceneTitle: string;
  isListening: boolean;
  activeReplyAudio: boolean;
  hasMessages: boolean;
};

type AudioFirstTutorState = {
  badgeLabel: string;
  title: string;
  summary: string;
  focusTitle: string;
  focusCopy: string;
  actionTitle: string;
  actionCopy: string;
  afterReplyTitle: string;
  afterReplyCopy: string;
  composerHint: string;
};

export function getAudioFirstTutorState({
  activeSceneTitle,
  isListening,
  activeReplyAudio,
  hasMessages,
}: AudioFirstTutorStateInput): AudioFirstTutorState {
  if (activeReplyAudio) {
    return {
      badgeLabel: "Tutor speaking",
      title: "Listen to the tutor, then return to the lesson",
      summary: "Tutor reply playback has audio focus right now, so the lesson stays paused and easy to resume afterward.",
      focusTitle: "Current focus",
      focusCopy: `The tutor is still grounded in ${activeSceneTitle}.`,
      actionTitle: "Voice loop",
      actionCopy: "The tutor reply is speaking now. Let it finish, then use the lesson resume card when you want to return to playback.",
      afterReplyTitle: "After this reply",
      afterReplyCopy: "Lesson audio will stay paused until you explicitly restart or resume it, so nothing starts speaking unexpectedly.",
      composerHint: "You can queue up the next question after this reply or jump back into listening with the resume card above.",
    };
  }

  if (isListening) {
    return {
      badgeLabel: "Voice input on",
      title: "Speak your question without losing your place",
      summary: "Voice input has paused lesson playback so you can dictate naturally before deciding whether to send the question.",
      focusTitle: "Current focus",
      focusCopy: `Your question will stay grounded in ${activeSceneTitle}.`,
      actionTitle: "While dictating",
      actionCopy: "Speak naturally. The transcript lands in the draft box first, so you can quickly review it before sending.",
      afterReplyTitle: "After you ask",
      afterReplyCopy: "Once the tutor responds, you can listen to the reply or go back to the lesson with the resume card.",
      composerHint: "Voice input fills the draft only. Nothing is sent until you choose to ask the tutor.",
    };
  }

  return {
    badgeLabel: hasMessages ? "Tutor ready" : "Ask while listening",
    title: hasMessages ? "Keep the tutor close to the listening flow" : "Ask the tutor without breaking audio mode",
    summary: hasMessages
      ? "The tutor thread is ready for follow-up questions while the lesson keeps its place for when you want to resume."
      : "Pause to ask a question, get a grounded answer, and then return to the lesson without losing the listening flow.",
    focusTitle: "Current focus",
    focusCopy: `The tutor follows ${activeSceneTitle}, so the conversation stays anchored to what you are hearing right now.`,
    actionTitle: "Ask now",
    actionCopy: "Voice input and typed questions both pause lesson playback first, keeping the handoff clear instead of overlapping audio.",
    afterReplyTitle: "Return to listening",
    afterReplyCopy: "Use tutor reply playback when you want spoken guidance, then continue the lesson with the manual resume action above.",
    composerHint: "Audio mode keeps tutor help close by, but lesson playback only restarts when you explicitly choose it.",
  };
}

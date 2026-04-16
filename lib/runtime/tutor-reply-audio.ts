type BrowserLike = {
  speechSynthesis?: unknown;
};

export type TutorReplyAudioSupport = {
  supported: boolean;
  message: string;
};

export function getTutorReplyAudioSupport(browser: BrowserLike | undefined): TutorReplyAudioSupport {
  if (!browser) {
    return {
      supported: false,
      message: "Tutor reply audio checks only run in the browser.",
    };
  }

  if ("speechSynthesis" in browser && browser.speechSynthesis) {
    return {
      supported: true,
      message: "Tutor replies can be played aloud in this browser.",
    };
  }

  return {
    supported: false,
    message: "Tutor reply audio is not available in this browser yet.",
  };
}

export function canPlayTutorReply(role: "assistant" | "user", content: string) {
  return role === "assistant" && content.trim().length > 0;
}

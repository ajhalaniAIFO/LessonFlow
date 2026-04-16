export type SpeechRecognitionSupport = {
  supported: boolean;
  implementationName?: "SpeechRecognition" | "webkitSpeechRecognition";
  message: string;
};

type BrowserLike = {
  SpeechRecognition?: unknown;
  webkitSpeechRecognition?: unknown;
};

export function getSpeechRecognitionSupport(browser: BrowserLike | undefined): SpeechRecognitionSupport {
  if (!browser) {
    return {
      supported: false,
      message: "Voice input checks only run in the browser.",
    };
  }

  if (browser.SpeechRecognition) {
    return {
      supported: true,
      implementationName: "SpeechRecognition",
      message: "Voice input is available in this browser.",
    };
  }

  if (browser.webkitSpeechRecognition) {
    return {
      supported: true,
      implementationName: "webkitSpeechRecognition",
      message: "Voice input is available in this browser.",
    };
  }

  return {
    supported: false,
    message: "Voice input is not available in this browser yet. You can still type your question.",
  };
}

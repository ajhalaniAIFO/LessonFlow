"use client";

import { useMemo } from "react";
import { useEffect, useRef, useState } from "react";
import {
  clearLessonAudioResume,
  isLessonAudioResumeTarget,
  isLessonAudioStopDetail,
  LESSON_AUDIO_RESUME_CLEAR_EVENT,
  LESSON_AUDIO_RESUME_REQUEST_EVENT,
  LESSON_AUDIO_RESUME_SUGGEST_EVENT,
  LESSON_AUDIO_STOP_EVENT,
  requestLessonAudioResume,
  requestLessonAudioStop,
  type LessonAudioResumeTarget,
} from "@/lib/runtime/audio-coordination";
import {
  AUDIO_PREFERENCES_KEY,
  DEFAULT_AUDIO_PREFERENCES,
  parseAudioPreferences,
} from "@/lib/runtime/audio-preferences";
import { getAudioFirstReplyResume } from "@/lib/runtime/audio-first-reply-resume";
import { getAudioFirstTutorState } from "@/lib/runtime/audio-first-tutor";
import { LESSON_AUDIO_RESUME_STORAGE_KEY, parseLessonAudioResume } from "@/lib/runtime/audio-resume";
import { getSpeechRecognitionSupport } from "@/lib/runtime/speech-recognition";
import { canPlayTutorReply, getTutorReplyAudioSupport } from "@/lib/runtime/tutor-reply-audio";
import type { ApiResponse } from "@/types/api";
import type { ChatMessage } from "@/types/chat";
import type { Scene } from "@/types/scene";

type BrowserSpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
};

type SpeechRecognitionResultLike = {
  transcript: string;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<
    ArrayLike<SpeechRecognitionResultLike> & {
      isFinal?: boolean;
    }
  >;
};

type SpeechRecognitionErrorEventLike = {
  error: string;
};

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

type BrowserWindowWithSpeech = Window &
  typeof globalThis & {
    SpeechRecognition?: BrowserSpeechRecognitionConstructor;
    webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
  };

type Props = {
  lessonId: string;
  scenes: Pick<Scene, "id" | "title" | "type">[];
  activeSceneId?: string;
  audioMode?: boolean;
};

export function TutorChatClient({ lessonId, scenes, activeSceneId, audioMode = false }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [speechMessage, setSpeechMessage] = useState("Checking browser voice input support...");
  const [isListening, setIsListening] = useState(false);
  const [replyAudioSupported, setReplyAudioSupported] = useState(false);
  const [replyAudioMessage, setReplyAudioMessage] = useState("Checking tutor reply audio support...");
  const [activeReplyAudioId, setActiveReplyAudioId] = useState<string | null>(null);
  const [replyResumeTarget, setReplyResumeTarget] = useState<LessonAudioResumeTarget | null>(null);
  const [showReplyResumeBridge, setShowReplyResumeBridge] = useState(false);
  const [selectedSceneId, setSelectedSceneId] = useState<string>(activeSceneId ?? scenes[0]?.id ?? "");
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const replyUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const replyVoiceURIRef = useRef(DEFAULT_AUDIO_PREFERENCES.voiceURI);
  const replyRateRef = useRef(DEFAULT_AUDIO_PREFERENCES.rate);
  const selectedSceneTitle = scenes.find((scene) => scene.id === selectedSceneId)?.title ?? "this lesson";

  const audioFirstTutorState = useMemo(
    () =>
      getAudioFirstTutorState({
        activeSceneTitle: selectedSceneTitle,
        isListening,
        activeReplyAudio: activeReplyAudioId !== null,
        hasMessages: messages.length > 0,
      }),
    [activeReplyAudioId, isListening, messages.length, selectedSceneTitle],
  );
  const replyResumeBridge = useMemo(
    () => (replyResumeTarget ? getAudioFirstReplyResume(replyResumeTarget) : null),
    [replyResumeTarget],
  );

  useEffect(() => {
    if (!selectedSceneId && scenes[0]?.id) {
      setSelectedSceneId(scenes[0].id);
    }
  }, [selectedSceneId, scenes]);

  useEffect(() => {
    if (activeSceneId && activeSceneId !== selectedSceneId) {
      setSelectedSceneId(activeSceneId);
    }
  }, [activeSceneId, selectedSceneId]);

  useEffect(() => {
    let active = true;

    async function loadMessages() {
      const query = selectedSceneId ? `?sceneId=${encodeURIComponent(selectedSceneId)}` : "";
      const response = await fetch(`/api/lessons/${lessonId}/chat${query}`, {
        cache: "no-store",
      });
      const payload = (await response.json()) as ApiResponse<{ messages: ChatMessage[] }>;

      if (active && payload.success) {
        setMessages(payload.data.messages);
      }
    }

    void loadMessages();
    return () => {
      active = false;
    };
  }, [lessonId, selectedSceneId]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const storedPreferences = window.localStorage.getItem(AUDIO_PREFERENCES_KEY);
      if (storedPreferences) {
        const parsed = parseAudioPreferences(JSON.parse(storedPreferences));
        replyVoiceURIRef.current = parsed.voiceURI;
        replyRateRef.current = parsed.rate;
      }
    } catch {
      replyVoiceURIRef.current = DEFAULT_AUDIO_PREFERENCES.voiceURI;
      replyRateRef.current = DEFAULT_AUDIO_PREFERENCES.rate;
    }

    const speechSupport = getSpeechRecognitionSupport(window as BrowserWindowWithSpeech);
    setSpeechSupported(speechSupport.supported);
    setSpeechMessage(speechSupport.message);

    const replySupport = getTutorReplyAudioSupport(window);
    setReplyAudioSupported(replySupport.supported);
    setReplyAudioMessage(replySupport.message);

    if (speechSupport.supported) {
      const BrowserRecognition =
        speechSupport.implementationName === "SpeechRecognition"
          ? (window as BrowserWindowWithSpeech).SpeechRecognition
          : (window as BrowserWindowWithSpeech).webkitSpeechRecognition;

      if (BrowserRecognition) {
        const recognition = new BrowserRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = "en-US";
        recognition.onresult = (event) => {
          const transcript = Array.from(event.results)
            .slice(event.resultIndex)
            .map((result) => result[0]?.transcript ?? "")
            .join(" ")
            .trim();

          if (!transcript) {
            return;
          }

          setDraft((current) => {
            const base = current.trim();
            return base ? `${base} ${transcript}`.trim() : transcript;
          });
        };
        recognition.onend = () => {
          setIsListening(false);
        };
        recognition.onerror = (event) => {
          setIsListening(false);
          setError(
            event.error === "not-allowed"
              ? "Microphone access was denied. You can still type your question."
              : "Voice input stopped unexpectedly. You can try again or type your question.",
          );
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      recognitionRef.current?.stop();
      window.speechSynthesis?.cancel();
      replyUtteranceRef.current = null;
      setActiveReplyAudioId(null);
      recognitionRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const stored = window.localStorage.getItem(LESSON_AUDIO_RESUME_STORAGE_KEY);
      if (stored) {
        const parsed = parseLessonAudioResume(JSON.parse(stored));
        if (parsed?.lessonId === lessonId) {
          setReplyResumeTarget(parsed);
        }
      }
    } catch {
      setReplyResumeTarget(null);
    }

    const handleSuggest = (event: Event) => {
      if (!(event instanceof CustomEvent) || !isLessonAudioResumeTarget(event.detail) || event.detail.lessonId !== lessonId) {
        return;
      }

      setReplyResumeTarget(event.detail);
    };

    const handleClear = () => {
      setReplyResumeTarget(null);
      setShowReplyResumeBridge(false);
    };

    const handleResumeRequest = (event: Event) => {
      if (!(event instanceof CustomEvent) || !isLessonAudioResumeTarget(event.detail) || event.detail.lessonId !== lessonId) {
        return;
      }

      setShowReplyResumeBridge(false);
    };

    window.addEventListener(LESSON_AUDIO_RESUME_SUGGEST_EVENT, handleSuggest);
    window.addEventListener(LESSON_AUDIO_RESUME_CLEAR_EVENT, handleClear);
    window.addEventListener(LESSON_AUDIO_RESUME_REQUEST_EVENT, handleResumeRequest);

    return () => {
      window.removeEventListener(LESSON_AUDIO_RESUME_SUGGEST_EVENT, handleSuggest);
      window.removeEventListener(LESSON_AUDIO_RESUME_CLEAR_EVENT, handleClear);
      window.removeEventListener(LESSON_AUDIO_RESUME_REQUEST_EVENT, handleResumeRequest);
    };
  }, [lessonId]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleStopRequest = (event: Event) => {
      if (
        !(event instanceof CustomEvent) ||
        !isLessonAudioStopDetail(event.detail) ||
        event.detail.source === "tutor-reply"
      ) {
        return;
      }

      window.speechSynthesis.cancel();
      replyUtteranceRef.current = null;
      setActiveReplyAudioId(null);
      setShowReplyResumeBridge(false);
    };

    window.addEventListener(LESSON_AUDIO_STOP_EVENT, handleStopRequest);

    return () => {
      window.removeEventListener(LESSON_AUDIO_STOP_EVENT, handleStopRequest);
    };
  }, []);

  async function handleSend() {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }

    if (typeof window !== "undefined") {
      requestLessonAudioStop(window, {
        source: "tutor-input",
        reason: "send-question",
      });
    }

    setIsSending(true);
    setError(null);

    const response = await fetch(`/api/lessons/${lessonId}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: draft,
        sceneId: selectedSceneId || undefined,
      }),
    });

    const payload = (await response.json()) as ApiResponse<{ message: ChatMessage }>;
    setIsSending(false);

    if (!payload.success) {
      setError(payload.error.message);
      return;
    }

    setMessages((current) => [
      ...current,
      {
        id: `temp-user-${Date.now()}`,
        lessonId,
        sceneId: selectedSceneId || undefined,
        role: "user",
        content: draft,
        createdAt: Date.now(),
      },
      payload.data.message,
    ]);
    setDraft("");
    setShowReplyResumeBridge(false);
  }

  function handleVoiceInput() {
    setError(null);

    if (!speechSupported || !recognitionRef.current) {
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    setShowReplyResumeBridge(false);
    requestLessonAudioStop(window, {
      source: "tutor-input",
      reason: "open-tutor",
    });

    recognitionRef.current.start();
    setIsListening(true);
  }

  function handleReplyAudioPlayback(message: ChatMessage) {
    if (typeof window === "undefined" || !replyAudioSupported || !canPlayTutorReply(message.role, message.content)) {
      return;
    }

    requestLessonAudioStop(window, {
      source: "tutor-reply",
      reason: "start-playback",
    });

    const synth = window.speechSynthesis;

    if (activeReplyAudioId === message.id) {
      synth.cancel();
      replyUtteranceRef.current = null;
      setActiveReplyAudioId(null);
      setShowReplyResumeBridge(false);
      return;
    }

    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(message.content);
    const availableVoices = synth.getVoices();
    const preferredVoice = availableVoices.find((voice) => voice.voiceURI === replyVoiceURIRef.current);
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    utterance.rate = Number(replyRateRef.current);
    utterance.onend = () => {
      replyUtteranceRef.current = null;
      setActiveReplyAudioId(null);
      if (replyResumeTarget) {
        setShowReplyResumeBridge(true);
      }
    };
    utterance.onerror = () => {
      replyUtteranceRef.current = null;
      setActiveReplyAudioId(null);
      setShowReplyResumeBridge(false);
      setError("Tutor reply playback stopped unexpectedly. You can try again.");
    };

    replyUtteranceRef.current = utterance;
    setShowReplyResumeBridge(false);
    setActiveReplyAudioId(message.id);
    synth.speak(utterance);
  }

  function handleReplyResume() {
    if (typeof window === "undefined" || !replyResumeTarget) {
      return;
    }

    requestLessonAudioResume(window, replyResumeTarget);
    window.localStorage.removeItem(LESSON_AUDIO_RESUME_STORAGE_KEY);
    clearLessonAudioResume(window);
    setShowReplyResumeBridge(false);
  }

  return (
    <section className={`card ${audioMode ? "audio-mode-tutor-shell" : ""}`} style={{ marginTop: "24px" }}>
      <h2>Ask the tutor</h2>
      <div className="form-grid">
        {audioMode ? (
          <section className="audio-mode-tutor-summary">
            <div className="audio-mode-tutor-summary-header">
              <div>
                <p className="status-title">{audioFirstTutorState.title}</p>
                <p className="status-copy">{audioFirstTutorState.summary}</p>
              </div>
              <span className="recommendation-badge info">{audioFirstTutorState.badgeLabel}</span>
            </div>
            <div className="audio-mode-tutor-grid">
              <div className="status-box audio-tutor-handoff-card">
                <p className="status-title">{audioFirstTutorState.focusTitle}</p>
                <p className="status-copy">{audioFirstTutorState.focusCopy}</p>
              </div>
              <div className="status-box audio-tutor-handoff-card">
                <p className="status-title">{audioFirstTutorState.actionTitle}</p>
                <p className="status-copy">{audioFirstTutorState.actionCopy}</p>
              </div>
              <div className="status-box audio-tutor-handoff-card">
                <p className="status-title">{audioFirstTutorState.afterReplyTitle}</p>
                <p className="status-copy">{audioFirstTutorState.afterReplyCopy}</p>
              </div>
            </div>
          </section>
        ) : null}

        {audioMode && showReplyResumeBridge && replyResumeTarget && replyResumeBridge ? (
          <div className="status-box audio-tutor-reply-resume-card">
            <div className="audio-mode-tutor-summary-header">
              <div>
                <p className="status-title">{replyResumeBridge.title}</p>
                <p className="status-copy">{replyResumeBridge.summary}</p>
                <p className="field-hint">{replyResumeBridge.helperCopy}</p>
              </div>
              <span className="recommendation-badge success">Resume ready</span>
            </div>
            <div className="button-row">
              <button className="button primary" type="button" onClick={handleReplyResume}>
                {replyResumeBridge.actionLabel}
              </button>
              <button className="button secondary" type="button" onClick={() => setShowReplyResumeBridge(false)}>
                Not yet
              </button>
            </div>
          </div>
        ) : null}

        <div className="field">
          <label>Current tutor focus</label>
          <div className="status-box" style={{ marginTop: 0 }}>
            <p className="status-title">
              {scenes.find((scene) => scene.id === selectedSceneId)?.title ?? "Whole lesson"}
            </p>
            <p className="status-copy">
              The tutor follows the scene you are currently viewing and keeps the conversation grounded there.
            </p>
          </div>
        </div>

        <div className={`status-box ${audioMode ? "audio-mode-tutor-thread" : ""}`}>
          {messages.length === 0 ? (
            <p className="status-copy">Ask a question about the lesson, with extra focus on the selected scene.</p>
          ) : (
            messages.map((message) => (
              <div key={message.id} className="tutor-message-row">
                <div className="tutor-message-header">
                  <p className="status-title" style={{ marginBottom: "4px" }}>
                    {message.role === "assistant" ? "Tutor" : "You"}
                  </p>
                  {canPlayTutorReply(message.role, message.content) ? (
                    <button
                      className="button secondary tutor-message-audio-button"
                      type="button"
                      onClick={() => handleReplyAudioPlayback(message)}
                      disabled={!replyAudioSupported}
                    >
                      {activeReplyAudioId === message.id ? "Stop reply audio" : "Listen to reply"}
                    </button>
                  ) : null}
                </div>
                {message.sceneId ? (
                  <p className="field-hint" style={{ margin: "0 0 4px" }}>
                    Focused on {scenes.find((scene) => scene.id === message.sceneId)?.title ?? "selected scene"}
                  </p>
                ) : null}
                <p className="status-copy">{message.content}</p>
                {audioMode && message.role === "assistant" ? (
                  <p className="field-hint" style={{ margin: "8px 0 0" }}>
                    {activeReplyAudioId === message.id
                      ? "Tutor reply playback has the audio focus now. Use the resume card above when you are ready to continue the lesson."
                      : "You can listen to this reply, then return to the lesson with the manual resume action above."}
                  </p>
                ) : null}
              </div>
            ))
          )}
        </div>

        <div className="field">
          <label htmlFor="tutor-chat">Question</label>
          <textarea
            id="tutor-chat"
            rows={4}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: "14px",
              border: "1px solid var(--border)",
              resize: "vertical",
            }}
            placeholder="What part of this lesson should I focus on first?"
          />
          <span className="field-hint">{audioMode ? audioFirstTutorState.composerHint : speechMessage}</span>
          <span className="field-hint">{speechMessage}</span>
          <span className="field-hint">{replyAudioMessage}</span>
        </div>

        <div className="button-row">
          <button
            className="button secondary"
            type="button"
            onClick={handleVoiceInput}
            disabled={!speechSupported || isSending}
          >
            {isListening ? "Stop voice input" : audioMode ? "Speak question" : "Use voice input"}
          </button>
          <button
            className="button primary"
            type="button"
            onClick={handleSend}
            disabled={isSending || draft.trim().length === 0}
          >
            {isSending ? "Thinking..." : audioMode ? "Ask and pause lesson" : "Send question"}
          </button>
        </div>

        {isListening ? (
          <div className="status-box">
            <p className="status-title">Listening...</p>
            <p className="status-copy">Speak naturally and we'll place the transcript into your draft.</p>
          </div>
        ) : null}

        {error ? (
          <div className="status-box error">
            <p className="status-title">Tutor chat failed</p>
            <p className="status-copy">{error}</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { getSpeechRecognitionSupport } from "@/lib/runtime/speech-recognition";
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
};

export function TutorChatClient({ lessonId, scenes, activeSceneId }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [speechMessage, setSpeechMessage] = useState("Checking browser voice input support...");
  const [isListening, setIsListening] = useState(false);
  const [selectedSceneId, setSelectedSceneId] = useState<string>(activeSceneId ?? scenes[0]?.id ?? "");
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);

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

    const support = getSpeechRecognitionSupport(window as BrowserWindowWithSpeech);
    setSpeechSupported(support.supported);
    setSpeechMessage(support.message);

    if (!support.supported) {
      recognitionRef.current = null;
      return;
    }

    const BrowserRecognition =
      support.implementationName === "SpeechRecognition"
        ? (window as BrowserWindowWithSpeech).SpeechRecognition
        : (window as BrowserWindowWithSpeech).webkitSpeechRecognition;

    if (!BrowserRecognition) {
      recognitionRef.current = null;
      return;
    }

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

    return () => {
      recognition.stop();
      recognitionRef.current = null;
    };
  }, []);

  async function handleSend() {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
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

    recognitionRef.current.start();
    setIsListening(true);
  }

  return (
    <section className="card" style={{ marginTop: "24px" }}>
      <h2>Ask the tutor</h2>
      <div className="form-grid">
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

        <div className="status-box">
          {messages.length === 0 ? (
            <p className="status-copy">Ask a question about the lesson, with extra focus on the selected scene.</p>
          ) : (
            messages.map((message) => (
              <div key={message.id} style={{ marginBottom: "12px" }}>
                <p className="status-title" style={{ marginBottom: "4px" }}>
                  {message.role === "assistant" ? "Tutor" : "You"}
                </p>
                {message.sceneId ? (
                  <p className="field-hint" style={{ margin: "0 0 4px" }}>
                    Focused on {scenes.find((scene) => scene.id === message.sceneId)?.title ?? "selected scene"}
                  </p>
                ) : null}
                <p className="status-copy">{message.content}</p>
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
          <span className="field-hint">{speechMessage}</span>
        </div>

        <div className="button-row">
          <button
            className="button secondary"
            type="button"
            onClick={handleVoiceInput}
            disabled={!speechSupported || isSending}
          >
            {isListening ? "Stop voice input" : "Use voice input"}
          </button>
          <button
            className="button primary"
            type="button"
            onClick={handleSend}
            disabled={isSending || draft.trim().length === 0}
          >
            {isSending ? "Thinking..." : "Send question"}
          </button>
        </div>

        {isListening ? (
          <div className="status-box">
            <p className="status-title">Listening...</p>
            <p className="status-copy">Speak naturally and we’ll place the transcript into your draft.</p>
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

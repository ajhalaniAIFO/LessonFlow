"use client";

import { useEffect, useState } from "react";
import type { ApiResponse } from "@/types/api";
import type { ChatMessage } from "@/types/chat";

type Props = {
  lessonId: string;
};

export function TutorChatClient({ lessonId }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadMessages() {
      const response = await fetch(`/api/lessons/${lessonId}/chat`, {
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
  }, [lessonId]);

  async function handleSend() {
    setIsSending(true);
    setError(null);

    const response = await fetch(`/api/lessons/${lessonId}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: draft,
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
        role: "user",
        content: draft,
        createdAt: Date.now(),
      },
      payload.data.message,
    ]);
    setDraft("");
  }

  return (
    <section className="card" style={{ marginTop: "24px" }}>
      <h2>Ask the tutor</h2>
      <div className="form-grid">
        <div className="status-box">
          {messages.length === 0 ? (
            <p className="status-copy">Ask a question about the current lesson and scenes.</p>
          ) : (
            messages.map((message) => (
              <div key={message.id} style={{ marginBottom: "12px" }}>
                <p className="status-title" style={{ marginBottom: "4px" }}>
                  {message.role === "assistant" ? "Tutor" : "You"}
                </p>
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
        </div>

        <div className="button-row">
          <button
            className="button primary"
            type="button"
            onClick={handleSend}
            disabled={isSending || draft.trim().length === 0}
          >
            {isSending ? "Thinking..." : "Send question"}
          </button>
        </div>

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

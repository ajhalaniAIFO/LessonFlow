"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ApiResponse } from "@/types/api";
import type { UploadRecord } from "@/types/upload";

type CreateLessonResult = {
  lessonId: string;
  jobId: string;
};

export function LessonRequestForm() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [language, setLanguage] = useState("en");
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadSummary, setUploadSummary] = useState<UploadRecord | null>(null);

  async function handleSubmit() {
    setIsSubmitting(true);
    setStatus(null);

    let uploadId: string | undefined;

    if (selectedFile) {
      const formData = new FormData();
      formData.append("file", selectedFile);
      const uploadResponse = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });
      const uploadPayload = (await uploadResponse.json()) as ApiResponse<UploadRecord>;

      if (!uploadPayload.success) {
        setIsSubmitting(false);
        setStatus(uploadPayload.error.message);
        return;
      }

      setUploadSummary(uploadPayload.data);
      if (uploadPayload.data.extractionStatus !== "ready") {
        setIsSubmitting(false);
        setStatus(uploadPayload.data.errorMessage ?? "Document text extraction failed.");
        return;
      }

      uploadId = uploadPayload.data.id;
    }

    const response = await fetch("/api/lessons", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        language,
        uploadId,
      }),
    });
    const payload = (await response.json()) as ApiResponse<CreateLessonResult>;
    setIsSubmitting(false);

    if (!payload.success) {
      setStatus(payload.error.message);
      return;
    }

    router.push(`/generate/${payload.data.jobId}`);
  }

  return (
    <div className="form-grid">
      <div className="field">
        <label htmlFor="lesson-prompt">Learning request</label>
        <textarea
          id="lesson-prompt"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          rows={6}
          style={{
            width: "100%",
            padding: "12px 14px",
            borderRadius: "14px",
            border: "1px solid var(--border)",
            resize: "vertical",
          }}
          placeholder="Teach me the basics of thermodynamics with one quick quiz near the end."
        />
      </div>

      <div className="field">
        <label htmlFor="lesson-file">Optional document</label>
        <input
          id="lesson-file"
          type="file"
          accept=".txt,.md,.markdown,.json,.csv,.pdf,text/plain,text/markdown,application/pdf"
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null;
            setSelectedFile(file);
            setUploadSummary(null);
          }}
        />
        <span className="field-hint">
          Upload a text-based document or PDF to ground the lesson in your own material.
        </span>
      </div>

      <div className="field">
        <label htmlFor="lesson-language">Language</label>
        <select
          id="lesson-language"
          value={language}
          onChange={(event) => setLanguage(event.target.value)}
        >
          <option value="en">English</option>
        </select>
      </div>

      <div className="button-row">
        <button
          className="button primary"
          type="button"
          disabled={isSubmitting || (prompt.trim().length === 0 && !selectedFile)}
          onClick={handleSubmit}
        >
          {isSubmitting ? "Creating..." : "Generate lesson outline"}
        </button>
      </div>

      {uploadSummary ? (
        <div className={`status-box ${uploadSummary.extractionStatus === "ready" ? "success" : "error"}`}>
          <p className="status-title">Uploaded document</p>
          <p className="status-copy">
            {uploadSummary.filename} - {uploadSummary.extractionStatus}
            {uploadSummary.extractedText
              ? ` - extracted ${uploadSummary.extractedText.length} characters`
              : ""}
          </p>
        </div>
      ) : null}

      {status ? (
        <div className="status-box error">
          <p className="status-title">Generation blocked</p>
          <p className="status-copy">{status}</p>
        </div>
      ) : null}
    </div>
  );
}

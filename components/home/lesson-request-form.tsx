"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { listGenerationModes } from "@/lib/server/lessons/generation-mode";
import {
  listLearnerLevels,
  listTeachingStyles,
} from "@/lib/server/lessons/personalization";
import { listLessonFormats } from "@/lib/server/lessons/teaching-modes";
import type { HardwareProfile } from "@/lib/runtime/hardware-profile";
import { getHardwareAwareRuntimeRecommendation } from "@/lib/runtime/runtime-recommendations";
import type { ApiResponse } from "@/types/api";
import type { UploadRecord } from "@/types/upload";
import type { GenerationMode, LearnerLevel, TeachingStyle, LessonFormat } from "@/types/lesson";

type CreateLessonResult = {
  lessonId: string;
  jobId: string;
};

type Props = {
  hardwareProfile: HardwareProfile;
};

export function LessonRequestForm({ hardwareProfile }: Props) {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [language, setLanguage] = useState("en");
  const [generationMode, setGenerationMode] = useState<GenerationMode>("balanced");
  const [learnerLevel, setLearnerLevel] = useState<LearnerLevel>("intermediate");
  const [teachingStyle, setTeachingStyle] = useState<TeachingStyle>("practical");
  const [lessonFormat, setLessonFormat] = useState<LessonFormat>("standard");
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadSummary, setUploadSummary] = useState<UploadRecord | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  const extractedPreview =
    uploadSummary?.extractedText?.slice(0, 280).trim() ?? "";
  const extractedCharacterCount = uploadSummary?.extractedText?.length ?? 0;
  const runtimeRecommendation = getHardwareAwareRuntimeRecommendation(
    generationMode,
    lessonFormat,
    hardwareProfile,
  );

  async function handleFileSelection(file: File | null) {
    setSelectedFile(file);
    setUploadSummary(null);
    setStatus(null);

    if (!file) {
      return;
    }

    setIsUploadingFile(true);

    const formData = new FormData();
    formData.append("file", file);

    const uploadResponse = await fetch("/api/uploads", {
      method: "POST",
      body: formData,
    });
    const uploadPayload = (await uploadResponse.json()) as ApiResponse<UploadRecord>;

    setIsUploadingFile(false);

    if (!uploadPayload.success) {
      setStatus(uploadPayload.error.message);
      return;
    }

    setUploadSummary(uploadPayload.data);

    if (uploadPayload.data.extractionStatus !== "ready") {
      setStatus(uploadPayload.data.errorMessage ?? "Document text extraction failed.");
    }
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    setStatus(null);

    let uploadId = uploadSummary?.id;

    if (selectedFile && !uploadSummary) {
      setIsSubmitting(false);
      setStatus("Wait for document analysis to finish before generating the lesson.");
      return;
    }

    if (selectedFile && uploadSummary?.extractionStatus !== "ready") {
      setIsSubmitting(false);
      setStatus(uploadSummary?.errorMessage ?? "Document text extraction failed.");
      return;
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
        generationMode,
        learnerLevel,
        teachingStyle,
        lessonFormat,
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
            void handleFileSelection(event.target.files?.[0] ?? null);
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

      <div className="field">
        <label htmlFor="generation-mode">Generation mode</label>
        <select
          id="generation-mode"
          value={generationMode}
          onChange={(event) => setGenerationMode(event.target.value as GenerationMode)}
        >
          {listGenerationModes().map((mode) => (
            <option key={mode.id} value={mode.id}>
              {mode.label}
            </option>
          ))}
        </select>
        <span className="field-hint">
          {listGenerationModes().find((mode) => mode.id === generationMode)?.description}
        </span>
      </div>

      <div className="field">
        <label htmlFor="learner-level">Learner level</label>
        <select
          id="learner-level"
          value={learnerLevel}
          onChange={(event) => setLearnerLevel(event.target.value as LearnerLevel)}
        >
          {listLearnerLevels().map((level) => (
            <option key={level.id} value={level.id}>
              {level.label}
            </option>
          ))}
        </select>
        <span className="field-hint">
          {listLearnerLevels().find((level) => level.id === learnerLevel)?.description}
        </span>
      </div>

      <div className="field">
        <label htmlFor="teaching-style">Teaching style</label>
        <select
          id="teaching-style"
          value={teachingStyle}
          onChange={(event) => setTeachingStyle(event.target.value as TeachingStyle)}
        >
          {listTeachingStyles().map((style) => (
            <option key={style.id} value={style.id}>
              {style.label}
            </option>
          ))}
        </select>
        <span className="field-hint">
          {listTeachingStyles().find((style) => style.id === teachingStyle)?.description}
        </span>
      </div>

      <div className="field">
        <label htmlFor="lesson-format">Lesson format</label>
        <select
          id="lesson-format"
          value={lessonFormat}
          onChange={(event) => setLessonFormat(event.target.value as LessonFormat)}
        >
          {listLessonFormats().map((format) => (
            <option key={format.id} value={format.id}>
              {format.label}
            </option>
          ))}
        </select>
        <span className="field-hint">
          {listLessonFormats().find((format) => format.id === lessonFormat)?.description}
        </span>
      </div>

      <div className="status-box">
        <p className="status-title">{runtimeRecommendation.headline}</p>
        <p className="status-copy">{runtimeRecommendation.summary}</p>
        <p className="field-hint" style={{ marginTop: "8px" }}>
          Hardware profile: {runtimeRecommendation.hardwareSummary} ({runtimeRecommendation.hardwareTier})
        </p>
        <ul className="meta-list" style={{ marginTop: "10px" }}>
          {runtimeRecommendation.why.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        {runtimeRecommendation.caution ? (
          <div className={`status-box ${runtimeRecommendation.fit === "strained" ? "error" : ""}`}>
            <p className="status-title">
              {runtimeRecommendation.fit === "strained"
                ? "This setup may feel heavy"
                : "Watch local runtime load"}
            </p>
            <p className="status-copy">{runtimeRecommendation.caution}</p>
          </div>
        ) : null}
      </div>

      <div className="button-row">
        <button
          className="button primary"
          type="button"
          disabled={
            isSubmitting ||
            isUploadingFile ||
            (prompt.trim().length === 0 && !selectedFile)
          }
          onClick={handleSubmit}
        >
          {isUploadingFile
            ? "Analyzing document..."
            : isSubmitting
              ? "Creating..."
              : "Generate lesson outline"}
        </button>
        {selectedFile ? (
          <button
            className="button secondary"
            type="button"
            disabled={isSubmitting || isUploadingFile}
            onClick={() => {
              setSelectedFile(null);
              setUploadSummary(null);
              setStatus(null);
            }}
          >
            Remove document
          </button>
        ) : null}
      </div>

      {uploadSummary ? (
        <div
          className={`status-box ${uploadSummary.extractionStatus === "ready" ? "success" : "error"}`}
        >
          <p className="status-title">Uploaded document</p>
          <p className="status-copy">
            {uploadSummary.filename} - {uploadSummary.extractionStatus} - {extractedCharacterCount} extracted characters
          </p>
          {extractedPreview ? (
            <div className="document-preview">
              <p className="document-preview-title">Preview excerpt</p>
              <p className="document-preview-copy">
                {extractedPreview}
                {extractedCharacterCount > extractedPreview.length ? "..." : ""}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

      {isUploadingFile ? (
        <div className="status-box">
          <p className="status-title">Analyzing document</p>
          <p className="status-copy">
            Pulling local text from {selectedFile?.name ?? "your file"} so you can review it before generation.
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

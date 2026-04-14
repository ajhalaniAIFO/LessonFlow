"use client";

import { useMemo, useState, useTransition } from "react";
import type { ModelInfo } from "@/lib/server/llm/types";
import type { ApiResponse } from "@/types/api";
import type { ModelSettings } from "@/types/settings";

type StatusState = {
  tone: "success" | "error";
  title: string;
  message: string;
};

type TestResult = {
  health: {
    provider: string;
    serverReachable: boolean;
    modelAvailable: boolean;
    message: string;
    endpointPath?: string;
    availableModelCount?: number;
    availableModelsPreview?: string[];
  };
  hardwareSummary: string;
  accelerationHint: string;
  workloadFit: "comfortable" | "watch" | "strained";
  nextSteps: string[];
};

type FormProps = {
  initialSettings: ModelSettings;
  recommendedSettings?: Partial<ModelSettings>;
};

export function SettingsForm({ initialSettings, recommendedSettings }: FormProps) {
  const [form, setForm] = useState<ModelSettings>(initialSettings);
  const [modelOptions, setModelOptions] = useState<ModelInfo[]>([]);
  const [status, setStatus] = useState<StatusState | null>(null);
  const [diagnostics, setDiagnostics] = useState<TestResult | null>(null);
  const [isSaving, startSaving] = useTransition();
  const [isTesting, startTesting] = useTransition();
  const [isLoadingModels, startLoadingModels] = useTransition();

  const selectedModelKnown = useMemo(
    () => modelOptions.some((model) => model.id === form.model),
    [form.model, modelOptions],
  );
  const providerBaseUrlPlaceholder =
    form.provider === "ollama"
      ? "http://127.0.0.1:11434"
      : "http://127.0.0.1:8000/v1";
  const providerModelPlaceholder =
    form.provider === "ollama" ? "qwen2.5:7b-instruct" : "google/gemma-3-4b-it";
  const providerBaseUrlHint =
    form.provider === "ollama"
      ? "Use your local Ollama endpoint."
      : "Use the base URL for your local OpenAI-compatible endpoint, such as vLLM or llama.cpp server mode.";

  function updateField<K extends keyof ModelSettings>(key: K, value: ModelSettings[K]) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function applyRecommendedSettings() {
    if (!recommendedSettings) {
      return;
    }

    setForm((current) => ({
      ...current,
      ...recommendedSettings,
    }));
    setStatus({
      tone: "success",
      title: "Recommended setup applied",
      message: "We copied the strongest recent provider/model pairing into the form. Save settings to keep it.",
    });
    setDiagnostics(null);
  }

  async function handleSave() {
    setStatus(null);
    setDiagnostics(null);
    startSaving(async () => {
      const response = await fetch("/api/settings/model", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const payload = (await response.json()) as ApiResponse<ModelSettings>;

      if (!payload.success) {
        setStatus({
          tone: "error",
          title: "Save failed",
          message: payload.error.message,
        });
        return;
      }

      setForm(payload.data);
      setStatus({
        tone: "success",
        title: "Settings saved",
        message: "Local model settings were persisted successfully.",
      });
    });
  }

  async function handleTest() {
    setStatus(null);
    setDiagnostics(null);
    startTesting(async () => {
      const response = await fetch("/api/settings/model/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const payload = (await response.json()) as ApiResponse<TestResult>;

      if (!payload.success) {
        setStatus({
          tone: "error",
          title: "Connection failed",
          message: payload.error.message,
        });
        return;
      }

      setDiagnostics(payload.data);
      setStatus({
        tone:
          payload.data.health.serverReachable && payload.data.health.modelAvailable
            ? "success"
            : "error",
        title:
          payload.data.health.serverReachable && payload.data.health.modelAvailable
            ? "Connection successful"
            : "Connection needs attention",
        message: payload.data.health.message,
      });
    });
  }

  async function handleLoadModels() {
    setStatus(null);
    setDiagnostics(null);
    const query = new URLSearchParams({
      baseUrl: form.baseUrl,
      provider: form.provider,
    });

    startLoadingModels(async () => {
      const response = await fetch(`/api/settings/model/models?${query.toString()}`);
      const payload = (await response.json()) as ApiResponse<{ models: ModelInfo[] }>;

      if (!payload.success) {
        setStatus({
          tone: "error",
          title: "Model discovery failed",
          message: payload.error.message,
        });
        return;
      }

      setModelOptions(payload.data.models);
      setStatus({
        tone: "success",
        title: "Model list refreshed",
        message:
          payload.data.models.length > 0
            ? `Found ${payload.data.models.length} local model${
                payload.data.models.length === 1 ? "" : "s"
              }.`
            : "No local models were returned. You can still type one manually.",
      });
    });
  }

  return (
    <div className="form-grid">
      <div className="field">
        <label htmlFor="provider">Provider</label>
        <select
          id="provider"
          value={form.provider}
          onChange={(event) => updateField("provider", event.target.value as ModelSettings["provider"])}
        >
          <option value="ollama">Ollama</option>
          <option value="openai_compatible">OpenAI-compatible local runtime</option>
        </select>
      </div>

      <div className="field">
        <label htmlFor="baseUrl">Base URL</label>
        <input
          id="baseUrl"
          value={form.baseUrl}
          onChange={(event) => updateField("baseUrl", event.target.value)}
          placeholder={providerBaseUrlPlaceholder}
        />
        <span className="field-hint">{providerBaseUrlHint}</span>
      </div>

      <div className="field">
        <label htmlFor="model">Model</label>
        <input
          id="model"
          value={form.model}
          onChange={(event) => updateField("model", event.target.value)}
          placeholder={providerModelPlaceholder}
          list="model-options"
        />
        <datalist id="model-options">
          {modelOptions.map((model) => (
            <option key={model.id} value={model.id}>
              {model.label}
            </option>
          ))}
        </datalist>
        <span className="field-hint">
          {selectedModelKnown
            ? "This model matches one returned by your local runtime."
            : "Manual entry is supported if model discovery is unavailable."}
        </span>
      </div>

      <div className="field">
        <label htmlFor="temperature">Temperature</label>
        <input
          id="temperature"
          type="number"
          step="0.1"
          min="0"
          max="2"
          value={form.temperature}
          onChange={(event) => updateField("temperature", Number(event.target.value))}
        />
      </div>

      <div className="field">
        <label htmlFor="maxTokens">Max tokens</label>
        <input
          id="maxTokens"
          type="number"
          min="256"
          step="128"
          value={form.maxTokens}
          onChange={(event) => updateField("maxTokens", Number(event.target.value))}
        />
      </div>

      <div className="field">
        <label htmlFor="timeoutMs">Timeout (ms)</label>
        <input
          id="timeoutMs"
          type="number"
          min="1000"
          step="1000"
          value={form.timeoutMs}
          onChange={(event) => updateField("timeoutMs", Number(event.target.value))}
        />
      </div>

      <div className="button-row">
        <button className="button primary" disabled={isSaving} onClick={handleSave} type="button">
          {isSaving ? "Saving..." : "Save settings"}
        </button>
        {recommendedSettings?.provider && recommendedSettings?.model ? (
          <button className="button secondary" onClick={applyRecommendedSettings} type="button">
            Apply recommended setup
          </button>
        ) : null}
        <button
          className="button secondary"
          disabled={isTesting}
          onClick={handleTest}
          type="button"
        >
          {isTesting ? "Testing..." : "Test connection"}
        </button>
        <button
          className="button secondary"
          disabled={isLoadingModels}
          onClick={handleLoadModels}
          type="button"
        >
          {isLoadingModels ? "Loading..." : "Load models"}
        </button>
      </div>

      {status ? (
        <div className={`status-box ${status.tone}`}>
          <p className="status-title">{status.title}</p>
          <p className="status-copy">{status.message}</p>
        </div>
      ) : null}

      {diagnostics ? (
        <div className="status-box">
          <p className="status-title">Runtime diagnostics</p>
          <p className="status-copy">Hardware: {diagnostics.hardwareSummary}</p>
          <p className="status-copy">{diagnostics.accelerationHint}</p>
          {diagnostics.health.endpointPath ? (
            <p className="status-copy">
              Checked endpoint: <span className="code-inline">{diagnostics.health.endpointPath}</span>
            </p>
          ) : null}
          {typeof diagnostics.health.availableModelCount === "number" ? (
            <p className="status-copy">
              Models reported by runtime: {diagnostics.health.availableModelCount}
            </p>
          ) : null}
          {diagnostics.health.availableModelsPreview?.length ? (
            <p className="status-copy">
              Preview: {diagnostics.health.availableModelsPreview.join(", ")}
            </p>
          ) : null}
          <p className="status-copy">
            Workload fit: <strong>{diagnostics.workloadFit}</strong>
          </p>
          <ul className="meta-list">
            {diagnostics.nextSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

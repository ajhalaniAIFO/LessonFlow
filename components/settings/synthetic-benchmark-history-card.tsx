import { formatTelemetryDuration } from "@/lib/server/lessons/job-progress";
import type { SyntheticBenchmarkRecord } from "@/types/settings";

type Props = {
  benchmarks: SyntheticBenchmarkRecord[];
};

function formatTimestamp(timestamp: number) {
  return new Date(timestamp).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function SyntheticBenchmarkHistoryCard({ benchmarks }: Props) {
  return (
    <div className="status-box">
      <p className="status-title">Synthetic benchmark history</p>
      <p className="status-copy">
        Controlled smoke-prompt runs for the currently selected provider/model.
      </p>

      {benchmarks.length === 0 ? (
        <p className="field-hint">
          Run a synthetic benchmark from the settings form and the result will appear here.
        </p>
      ) : (
        <div className="runtime-history-list">
          {benchmarks.map((benchmark) => (
            <div key={benchmark.id} className="runtime-history-row">
              <div>
                <strong>{benchmark.provider} | {benchmark.model}</strong>
                <p className="status-copy">{formatTimestamp(benchmark.createdAt)}</p>
                {benchmark.outputPreview ? (
                  <small className="status-copy">Preview: {benchmark.outputPreview}</small>
                ) : null}
                {benchmark.errorMessage ? (
                  <small className="status-copy">Error: {benchmark.errorMessage}</small>
                ) : null}
              </div>
              <div className="runtime-job-metrics">
                <span>{formatTelemetryDuration(benchmark.durationMs)}</span>
                <small>
                  {benchmark.status} | {benchmark.outputChars ?? 0} chars
                </small>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

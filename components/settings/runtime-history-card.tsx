import { formatTelemetryDuration } from "@/lib/server/lessons/job-progress";
import type { RuntimeHistory } from "@/lib/runtime/runtime-history";

type Props = {
  history: RuntimeHistory;
};

function formatRunTimestamp(timestamp: number) {
  return new Date(timestamp).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function RuntimeHistoryCard({ history }: Props) {
  return (
    <div className="status-box">
      <p className="status-title">{history.headline}</p>
      <p className="status-copy">{history.summary}</p>

      {history.entries.length > 0 ? (
        <div className="runtime-history-list">
          {history.entries.map((entry) => (
            <div key={entry.jobId} className="runtime-history-row">
              <div>
                <strong>{entry.lessonTitle}</strong>
                <p className="status-copy">{formatRunTimestamp(entry.updatedAt)}</p>
              </div>
              <div className="runtime-job-metrics">
                <span>{formatTelemetryDuration(entry.totalMs)}</span>
                <small>
                  {entry.lessonSceneCount ?? 0} lesson scene{entry.lessonSceneCount === 1 ? "" : "s"} |{" "}
                  {entry.quizSceneCount ?? 0} quiz scene{entry.quizSceneCount === 1 ? "" : "s"}
                </small>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

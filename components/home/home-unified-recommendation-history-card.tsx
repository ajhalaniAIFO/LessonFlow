import type { HomeUnifiedRecommendationHistory } from "@/lib/runtime/home-unified-recommendation-history";

type Props = {
  history: HomeUnifiedRecommendationHistory;
};

function formatTimestamp(timestamp: number) {
  return new Date(timestamp).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function HomeUnifiedRecommendationHistoryCard({ history }: Props) {
  return (
    <article className="card">
      <h2>Recommendation history</h2>
      <div className="status-box">
        <p className="status-title">{history.headline}</p>
        <p className="status-copy">{history.summary}</p>
      </div>

      {history.entries.length > 0 ? (
        <div className="runtime-history-list">
          {history.entries.map((entry) => (
            <div key={entry.id} className="runtime-history-row">
              <div>
                <strong>{entry.headline}</strong>
                <p className="status-copy">{formatTimestamp(entry.timestamp)}</p>
                <small className="status-copy">{entry.summary}</small>
              </div>
              <div className="runtime-job-metrics">
                <span>{entry.agreementLabel}</span>
                <small>
                  {entry.observedSetupLabel ?? "no observed leader"} |{" "}
                  {entry.syntheticSetupLabel ?? "no synthetic leader"}
                </small>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </article>
  );
}

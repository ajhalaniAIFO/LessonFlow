import { getHomeUnifiedRecommendationChart } from "@/lib/runtime/home-unified-recommendation-chart";
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
  const chart = getHomeUnifiedRecommendationChart(history.entries);

  return (
    <article className="card">
      <h2>Recommendation history</h2>
      <div className="status-box">
        <p className="status-title">{history.headline}</p>
        <p className="status-copy">{history.summary}</p>
      </div>

      {chart.label === "ready" ? (
        <div className="status-box">
          <p className="status-title">{chart.headline}</p>
          <p className="status-copy">{chart.summary}</p>
          <div className="runtime-comparison-chart-shell">
            <svg
              className="runtime-comparison-chart"
              viewBox="0 0 100 28"
              preserveAspectRatio="none"
              role="img"
              aria-label="Unified recommendation history chart"
            >
              <polyline
                className="runtime-comparison-chart-line"
                points={chart.points.map((point) => `${point.x},${point.y}`).join(" ")}
              />
              {chart.points.map((point) => (
                <circle
                  key={point.id}
                  className="runtime-comparison-chart-point"
                  cx={point.x}
                  cy={point.y}
                  r="1.8"
                />
              ))}
            </svg>
          </div>
          <div className="runtime-summary-grid">
            <div className="runtime-summary-item">
              <strong>Low</strong>
              <small>{chart.lowLabel}</small>
            </div>
            <div className="runtime-summary-item">
              <strong>High</strong>
              <small>{chart.highLabel}</small>
            </div>
          </div>
        </div>
      ) : null}

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

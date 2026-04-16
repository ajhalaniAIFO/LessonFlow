import Link from "next/link";
import { getHomeUnifiedRecommendationBadge } from "@/lib/runtime/home-unified-recommendation-badges";
import type { HomeUnifiedRecommendation } from "@/lib/runtime/home-unified-recommendations";

type Props = {
  recommendation: HomeUnifiedRecommendation;
};

export function HomeUnifiedRecommendationCard({ recommendation }: Props) {
  const badge = getHomeUnifiedRecommendationBadge(recommendation.agreementLabel);
  const toneClass =
    recommendation.agreementLabel === "agree" ? "success" : "";

  return (
    <article className="card">
      <h2>Recommendation snapshot</h2>
      <div className={`status-box ${toneClass}`}>
        <span className={`recommendation-badge ${badge.tone}`}>{badge.label}</span>
        <p className="status-title">{recommendation.headline}</p>
        <p className="status-copy">{recommendation.summary}</p>
      </div>

      <div className="runtime-summary-grid">
        <div className="runtime-summary-item">
          <strong>Current setup</strong>
          <p className="status-copy">{recommendation.currentSetupLabel}</p>
          <small>{badge.label} recommendation state</small>
        </div>

        {recommendation.observedSetupLabel ? (
          <div className="runtime-summary-item">
            <strong>Observed lesson leader</strong>
            <p className="status-copy">{recommendation.observedSetupLabel}</p>
            <small>Best recent real lesson-generation performer</small>
          </div>
        ) : null}

        {recommendation.syntheticSetupLabel ? (
          <div className="runtime-summary-item">
            <strong>Synthetic benchmark leader</strong>
            <p className="status-copy">{recommendation.syntheticSetupLabel}</p>
            <small>Fastest recent controlled smoke-prompt setup</small>
          </div>
        ) : null}
      </div>

      {recommendation.actionMessage ? (
        <div className="status-box">
          <p className="status-title">Recommended next move</p>
          <p className="status-copy">{recommendation.actionMessage}</p>
        </div>
      ) : null}

      <div className="button-row">
        <Link className="button secondary" href={recommendation.actionHref}>
          {recommendation.actionLabel}
        </Link>
      </div>
    </article>
  );
}

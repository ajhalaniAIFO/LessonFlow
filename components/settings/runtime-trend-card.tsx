import type { RuntimeTrend } from "@/lib/runtime/runtime-trends";

type Props = {
  trend: RuntimeTrend;
};

export function RuntimeTrendCard({ trend }: Props) {
  return (
    <div
      className={`status-box ${
        trend.label === "improving" ? "success" : trend.label === "regressing" ? "error" : ""
      }`}
    >
      <p className="status-title">{trend.headline}</p>
      <p className="status-copy">{trend.summary}</p>
      <ul className="meta-list">
        {trend.details.map((detail) => (
          <li key={detail}>{detail}</li>
        ))}
      </ul>
    </div>
  );
}

import type { RuntimeBenchmark } from "@/lib/runtime/runtime-benchmarking";

type Props = {
  benchmark: RuntimeBenchmark;
};

export function RuntimeBenchmarkCard({ benchmark }: Props) {
  return (
    <div
      className={`status-box ${
        benchmark.label === "quick" ? "success" : benchmark.label === "heavy" ? "error" : ""
      }`}
    >
      <p className="status-title">{benchmark.headline}</p>
      <p className="status-copy">{benchmark.summary}</p>
      <ul className="meta-list">
        {benchmark.details.map((detail) => (
          <li key={detail}>{detail}</li>
        ))}
      </ul>
    </div>
  );
}

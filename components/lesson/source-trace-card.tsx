import type { SourceContext } from "@/types/upload";

type Props = {
  sourceContext: SourceContext;
  sceneType: "lesson" | "quiz";
};

export function SourceTraceCard({ sourceContext, sceneType }: Props) {
  return (
    <div className="status-box source-trace-box">
      <p className="status-title">
        {sceneType === "lesson" ? "Source grounding" : "Checkpoint source grounding"}
      </p>
      {sourceContext.rationale ? (
        <p className="status-copy">{sourceContext.rationale}</p>
      ) : null}
      <p className="status-copy source-trace-excerpt">{sourceContext.excerpt}</p>
      {sourceContext.highlights.length ? (
        <p className="status-copy">
          {sourceContext.emphasisLabel ?? "Highlights"}: {sourceContext.highlights.join(", ")}
        </p>
      ) : null}
    </div>
  );
}

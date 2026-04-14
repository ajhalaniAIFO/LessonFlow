import { listRuntimeGuidance } from "@/lib/server/settings/runtime-guidance";
import type { ModelProvider } from "@/types/settings";

type Props = {
  activeProvider: ModelProvider;
};

export function RuntimeGuidancePanel({ activeProvider }: Props) {
  const guidance = listRuntimeGuidance();

  return (
    <aside className="card">
      <h3>Runtime guidance</h3>
      <div className="runtime-guidance-list">
        {guidance.map((entry) => (
          <section
            key={entry.provider}
            className={`runtime-guidance-card ${
              entry.provider === activeProvider ? "active" : ""
            }`}
          >
            <p className="runtime-guidance-title">{entry.label}</p>
            <p className="field-hint">
              Endpoint shape: <span className="code-inline">{entry.endpointShape}</span>
            </p>
            <p className="field-hint">
              Default URL: <span className="code-inline">{entry.defaultUrl}</span>
            </p>
            <p className="field-hint">
              Example model: <span className="code-inline">{entry.exampleModel}</span>
            </p>

            <strong>Best for</strong>
            <ul className="meta-list">
              {entry.bestFor.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <strong>Setup</strong>
            <ol className="step-list">
              {entry.setupSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>

            <strong>Compatibility hints</strong>
            <ul className="meta-list">
              {entry.compatibilityHints.map((hint) => (
                <li key={hint}>{hint}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </aside>
  );
}

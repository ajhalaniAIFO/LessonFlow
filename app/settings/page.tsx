import Link from "next/link";
import { SettingsForm } from "@/components/settings/model-settings-form";
import { getHardwareProfile } from "@/lib/runtime/hardware-profile";
import { getHardwareAwareRuntimeRecommendation } from "@/lib/runtime/runtime-recommendations";
import { getModelSettings } from "@/lib/server/settings/settings-service";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getModelSettings();
  const hardwareProfile = getHardwareProfile();
  const balancedStandardRecommendation = getHardwareAwareRuntimeRecommendation(
    "balanced",
    "standard",
    hardwareProfile,
  );
  const providerTip = balancedStandardRecommendation.providerTips[settings.provider];

  return (
    <main className="page-shell">
      <nav className="nav">
        <div>
          <strong>LessonFlow</strong>
        </div>
        <div className="nav-links">
          <Link className="nav-link" href="/">
            Home
          </Link>
          <Link className="nav-link active" href="/settings">
            Settings
          </Link>
        </div>
      </nav>

      <section className="hero">
        <span className="eyebrow">Week 2 Vertical Slice</span>
        <h1>Connect LessonFlow to your local runtime.</h1>
        <p>
          The app stores model settings in SQLite, can test runtime connectivity,
          and can list installed models from local endpoints like Ollama or an
          OpenAI-compatible runtime. Once this slice is stable, we can build
          lesson generation on top of it with much lower risk.
        </p>
      </section>

      <section className="card-grid">
        <article className="card">
          <h2>Model settings</h2>
          <SettingsForm initialSettings={settings} />
        </article>

        <aside className="card">
          <h3>Recommendation hints</h3>
          <p className="status-copy">{balancedStandardRecommendation.summary}</p>
          <p className="field-hint">
            Hardware profile: {balancedStandardRecommendation.hardwareSummary} ({balancedStandardRecommendation.hardwareTier})
          </p>
          <p className="field-hint">{balancedStandardRecommendation.accelerationHint}</p>
          <ul className="meta-list">
            <li>
              Recommended URL for this provider:{" "}
              <span className="code-inline">{providerTip.recommendedUrl}</span>
            </li>
            <li>
              Recommended example models:{" "}
              {providerTip.exampleModels.map((model, index) => (
                <span key={model}>
                  {index > 0 ? ", " : ""}
                  <span className="code-inline">{model}</span>
                </span>
              ))}
            </li>
            <li>
              Workload class:{" "}
              <span className="code-inline">{balancedStandardRecommendation.workloadClass}</span>
            </li>
            <li>
              {providerTip.hint}
            </li>
            <li>No cloud API key is required for this setup.</li>
          </ul>
          {balancedStandardRecommendation.caution ? (
            <div className={`status-box ${balancedStandardRecommendation.fit === "strained" ? "error" : ""}`}>
              <p className="status-title">
                {balancedStandardRecommendation.fit === "strained"
                  ? "This machine may be stretched"
                  : "Watch local runtime load"}
              </p>
              <p className="status-copy">{balancedStandardRecommendation.caution}</p>
            </div>
          ) : null}
        </aside>
      </section>
    </main>
  );
}

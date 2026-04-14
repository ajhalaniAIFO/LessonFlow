import Link from "next/link";
import { SettingsForm } from "@/components/settings/model-settings-form";
import { RuntimeBenchmarkCard } from "@/components/settings/runtime-benchmark-card";
import { SettingsRuntimeAlertCard } from "@/components/settings/runtime-alert-card";
import { RuntimeComparisonCard } from "@/components/settings/runtime-comparison-card";
import { RuntimeHistoryCard } from "@/components/settings/runtime-history-card";
import { RuntimeTrendCard } from "@/components/settings/runtime-trend-card";
import { getRuntimeAlerts } from "@/lib/runtime/runtime-alerts";
import { getRuntimeComparisonCharts } from "@/lib/runtime/runtime-comparison-chart";
import { getHardwareProfile } from "@/lib/runtime/hardware-profile";
import { getRecommendedRuntimeSetup } from "@/lib/runtime/runtime-comparison";
import { getRuntimeBenchmark } from "@/lib/runtime/runtime-benchmarking";
import { getRuntimeHistory } from "@/lib/runtime/runtime-history";
import { getHardwareAwareRuntimeRecommendation } from "@/lib/runtime/runtime-recommendations";
import { getRuntimeTrend } from "@/lib/runtime/runtime-trends";
import { getRuntimeComparison, getRuntimeUsageDashboard } from "@/lib/server/lessons/lesson-service";
import { getModelSettings } from "@/lib/server/settings/settings-service";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getModelSettings();
  const runtimeDashboard = await getRuntimeUsageDashboard();
  const runtimeComparison = await getRuntimeComparison();
  const runtimeComparisonCharts = getRuntimeComparisonCharts(runtimeDashboard.recentJobs);
  const hardwareProfile = getHardwareProfile();
  const balancedStandardRecommendation = getHardwareAwareRuntimeRecommendation(
    "balanced",
    "standard",
    hardwareProfile,
  );
  const benchmark = getRuntimeBenchmark(settings, runtimeDashboard);
  const history = getRuntimeHistory(
    {
      provider: settings.provider,
      model: settings.model,
    },
    runtimeDashboard.recentJobs,
  );
  const recommendedSetup = getRecommendedRuntimeSetup(runtimeComparison);
  const trend = getRuntimeTrend(
    {
      provider: settings.provider,
      model: settings.model,
    },
    runtimeDashboard.recentJobs
      .filter(
        (job) =>
          job.runtimeProvider === settings.provider &&
          job.runtimeModel === settings.model &&
          typeof job.telemetry?.totalMs === "number",
      )
      .map((job) => ({
        updatedAt: job.updatedAt,
        totalMs: job.telemetry!.totalMs!,
      })),
  );
  const runtimeAlerts = getRuntimeAlerts(
    settings,
    runtimeDashboard,
    runtimeComparison,
    trend,
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
          <SettingsForm
            initialSettings={settings}
            recommendedSettings={
              recommendedSetup
                ? {
                    provider: recommendedSetup.provider,
                    model: recommendedSetup.model,
                  }
                : undefined
            }
          />
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

          <RuntimeBenchmarkCard benchmark={benchmark} />
          <SettingsRuntimeAlertCard alerts={runtimeAlerts} />
          <RuntimeTrendCard trend={trend} />
          <RuntimeHistoryCard history={history} />
          <RuntimeComparisonCard items={runtimeComparison} charts={runtimeComparisonCharts} />
        </aside>
      </section>
    </main>
  );
}

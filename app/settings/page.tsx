import Link from "next/link";
import { SettingsForm } from "@/components/settings/model-settings-form";
import { RuntimeGuidancePanel } from "@/components/settings/runtime-guidance-panel";
import { getModelSettings } from "@/lib/server/settings/settings-service";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getModelSettings();

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

        <RuntimeGuidancePanel activeProvider={settings.provider} />
      </section>
    </main>
  );
}

import Link from "next/link";
import { LessonLibrary } from "@/components/home/lesson-library";
import { LessonRequestForm } from "@/components/home/lesson-request-form";
import { RuntimeUsageDashboardCard } from "@/components/home/runtime-usage-dashboard";
import { getRuntimeUsageDashboard, listLessons } from "@/lib/server/lessons/lesson-service";
import { getHardwareProfile } from "@/lib/runtime/hardware-profile";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const lessons = await listLessons();
  const runtimeDashboard = await getRuntimeUsageDashboard();
  const hardwareProfile = getHardwareProfile();

  return (
    <main className="page-shell">
      <nav className="nav">
        <div>
          <strong>LessonFlow</strong>
        </div>
        <div className="nav-links">
          <Link className="nav-link active" href="/">
            Home
          </Link>
          <Link className="nav-link" href="/settings">
            Settings
          </Link>
        </div>
      </nav>

      <section className="hero">
        <span className="eyebrow">Local LLM Foundation</span>
        <h1>Private lesson generation starts with a stable local model setup.</h1>
        <p>
          This first milestone intentionally focuses on the local runtime slice:
          SQLite persistence, Ollama connectivity, model discovery, and a settings
          UI that blocks generation until the app can talk to your local model
          server reliably.
        </p>
      </section>

      <section className="card-grid">
        <article className="card">
          <h2>Start the next milestone</h2>
          <LessonRequestForm hardwareProfile={hardwareProfile} />
        </article>

        <aside className="card">
          <h3>What is working now</h3>
          <ol className="step-list">
            <li>Project bootstrap for a Next.js and TypeScript app</li>
            <li>SQLite-backed settings persistence</li>
            <li>Ollama health checks and model listing endpoints</li>
            <li>Settings page for base URL, model, and generation defaults</li>
            <li>Prompt-to-outline lesson generation with saved jobs</li>
            <li>Automated tests for settings and provider behavior</li>
          </ol>
          <div className="button-row">
            <Link className="button primary" href="/settings">
              Configure local model
            </Link>
          </div>
          <ul className="meta-list">
            <li>Install Ollama on your machine</li>
            <li>
              Start the runtime and confirm it is reachable at{" "}
              <span className="code-inline">http://127.0.0.1:11434</span>
            </li>
            <li>
              Pull a model such as{" "}
              <span className="code-inline">qwen2.5:7b-instruct</span>
            </li>
            <li>Open the settings page and test the connection</li>
            <li>Return here and generate your first lesson outline</li>
          </ul>
        </aside>
      </section>

      <section style={{ marginTop: "24px" }}>
        <RuntimeUsageDashboardCard dashboard={runtimeDashboard} />
      </section>

      <section style={{ marginTop: "24px" }}>
        <LessonLibrary lessons={lessons} />
      </section>
    </main>
  );
}

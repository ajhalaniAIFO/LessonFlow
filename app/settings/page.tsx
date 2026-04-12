import Link from "next/link";
import { SettingsForm } from "@/components/settings/model-settings-form";
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
        <h1>Connect LessonFlow to your local Ollama runtime.</h1>
        <p>
          The app stores model settings in SQLite, can test runtime connectivity,
          and can list installed models from your local endpoint. Once this slice
          is stable, we can build lesson generation on top of it with much lower
          risk.
        </p>
      </section>

      <section className="card-grid">
        <article className="card">
          <h2>Model settings</h2>
          <SettingsForm initialSettings={settings} />
        </article>

        <aside className="card">
          <h3>Quick guidance</h3>
          <ul className="meta-list">
            <li>
              Default Ollama URL:{" "}
              <span className="code-inline">http://127.0.0.1:11434</span>
            </li>
            <li>
              Example model:{" "}
              <span className="code-inline">qwen2.5:7b-instruct</span>
            </li>
            <li>
              If model discovery returns nothing, you can still type the model
              name manually.
            </li>
            <li>No cloud API key is required for this milestone.</li>
          </ul>
        </aside>
      </section>
    </main>
  );
}

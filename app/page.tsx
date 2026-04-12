import Link from "next/link";

export default function HomePage() {
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
          <h2>What is working in this milestone</h2>
          <ol className="step-list">
            <li>Project bootstrap for a Next.js and TypeScript app</li>
            <li>SQLite-backed settings persistence</li>
            <li>Ollama health checks and model listing endpoints</li>
            <li>Settings page for base URL, model, and generation defaults</li>
          </ol>
          <div className="button-row">
            <Link className="button primary" href="/settings">
              Configure local model
            </Link>
          </div>
        </article>

        <aside className="card">
          <h3>Recommended local setup</h3>
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
          </ul>
        </aside>
      </section>
    </main>
  );
}

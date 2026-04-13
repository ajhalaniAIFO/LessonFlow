import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

const e2ePort = 3100;
const e2eDbPath = path.join(process.cwd(), "data", "e2e.db");

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  fullyParallel: false,
  reporter: "list",
  use: {
    baseURL: `http://127.0.0.1:${e2ePort}`,
    trace: "retain-on-failure",
  },
  webServer: {
    command: `npm run dev -- --hostname 127.0.0.1 --port ${e2ePort}`,
    url: `http://127.0.0.1:${e2ePort}`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      LESSONFLOW_DB_PATH: e2eDbPath,
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});

# E2E Smoke Tests

These Playwright tests cover lightweight browser-level smoke paths for LessonFlow.

Current scope:
- home page loads
- primary lesson creation controls are visible
- settings flow can save, test, and load models through mocked API responses
- lesson request flow can reach the outline review step with seeded test data
- outline review can continue into the lesson experience with seeded lesson scenes

Before running locally:
1. install dependencies with `npm install`
2. install Playwright browsers with `npx playwright install`
3. run `npm run test:e2e`

The Playwright config starts an isolated local dev server on port `3100` and
uses a dedicated SQLite file at `data/e2e.db` so browser tests do not reuse
your normal local app data.

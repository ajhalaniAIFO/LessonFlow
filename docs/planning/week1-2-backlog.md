# Week 1-2 Engineering Backlog

This backlog translates the local-LLM-first MVP plan into implementation-ready work for the first two weeks.

## Planning Principles

- Optimize for a working vertical slice over broad coverage.
- Keep cloud-model assumptions out of the architecture.
- Put provider abstraction and persistence in place before lesson generation.
- Prefer thin route handlers and reusable server-side services.
- Validate structured model output early because local models are less predictable.

## Week 1 Goal

Stand up the app foundation so the codebase can support local inference, SQLite persistence, and clean server-side orchestration.

## Week 2 Goal

Ship a complete local-model setup flow with saved settings, connection testing, model discovery, and clear blocked-state UX when no local model is configured.

## Milestone Outcomes

At the end of Week 2, the app should:

1. Persist local model settings in SQLite.
2. Support an `Ollama` provider adapter behind a generic provider interface.
3. Let the user configure base URL, model, and generation defaults in the UI.
4. Verify local runtime connectivity from the app.
5. Block lesson generation until setup is valid.

## Ticket Format

Each ticket includes:

1. Purpose
2. Scope
3. Deliverables
4. Acceptance criteria
5. Dependencies

## Week 1 Tickets

### W1-01 Project Skeleton

Purpose:
Create a stable module layout for API routes, server services, provider adapters, shared types, prompts, and database code.

Scope:

- Add the agreed folder structure for `app/api`, `lib/server`, `lib/db`, `types`, and `prompts`.
- Add placeholder README files or starter modules only where needed to make ownership obvious.
- Do not implement lesson generation yet.

Deliverables:

- Base directories exist.
- Shared type entry points exist.
- Server-side module boundaries are documented in code comments or filenames.

Acceptance criteria:

- A new contributor can tell where route logic, business logic, DB logic, and provider logic belong.
- No provider-specific code exists inside route handlers.

Dependencies:

- None

### W1-02 SQLite Bootstrap

Purpose:
Introduce a reliable local persistence layer for settings and future lesson data.

Scope:

- Add SQLite client setup.
- Add migration runner.
- Create initial schema for `app_settings`.
- Store DB file under a local app-managed data path.

Deliverables:

- `lib/db/client.ts`
- `lib/db/schema.ts`
- `scripts/migrate.ts`
- Initial migration support

Acceptance criteria:

- Running migrations creates the database successfully.
- The app can read and write rows in `app_settings`.
- Foreign keys are enabled in SQLite initialization.

Dependencies:

- W1-01

### W1-03 Shared Types and API Envelopes

Purpose:
Create shared contracts so frontend and backend stay aligned from the start.

Scope:

- Add TypeScript types for settings, API success/error envelopes, health-check results, and model metadata.
- Define stable error codes for the first vertical slice.

Deliverables:

- `types/settings.ts`
- `types/api.ts`
- Shared error code definitions

Acceptance criteria:

- API routes and services use shared response types.
- Error shape is consistent across settings endpoints.

Dependencies:

- W1-01

### W1-04 Error and Logging Utilities

Purpose:
Avoid ad hoc error handling and make backend failures understandable.

Scope:

- Add app-level error helpers.
- Add structured logger utility for server-side modules.
- Add error serialization helpers for route handlers.

Deliverables:

- `lib/server/utils/errors.ts`
- `lib/server/utils/logger.ts`

Acceptance criteria:

- Route handlers can convert thrown service errors into the standard API envelope.
- Server-side logs include module/source context.

Dependencies:

- W1-01
- W1-03

### W1-05 LLM Provider Abstraction

Purpose:
Establish a provider interface that supports local runtimes without coupling business logic to one vendor.

Scope:

- Define `LLMProvider` interface.
- Add input/output types for health checks, model listing, plain text generation, and structured generation.
- Add provider registry shape.

Deliverables:

- `lib/server/llm/types.ts`
- `lib/server/llm/provider-registry.ts`

Acceptance criteria:

- Business logic can request a provider through the registry rather than importing `Ollama` directly.
- Interface supports future adapters such as `vLLM` without redesign.

Dependencies:

- W1-01
- W1-03

### W1-06 Ollama Provider Initial Implementation

Purpose:
Create the first concrete local model adapter for the MVP.

Scope:

- Implement `healthCheck`.
- Implement `listModels`.
- Implement basic `generateText`.
- Stub `generateStructuredJson` with validation hook points.

Deliverables:

- `lib/server/llm/ollama-provider.ts`

Acceptance criteria:

- App can detect whether an Ollama server is reachable.
- App can fetch model tags from the configured base URL.
- Provider errors surface actionable messages.

Dependencies:

- W1-05
- W1-04

### W1-07 Settings Persistence Service

Purpose:
Move model settings logic out of route handlers and into a reusable service.

Scope:

- Add `getModelSettings`.
- Add `saveModelSettings`.
- Add shape validation for persisted settings.

Deliverables:

- `lib/server/settings/settings-service.ts`

Acceptance criteria:

- Settings are stored under a stable key such as `llm_config`.
- Invalid settings payloads are rejected before persistence.

Dependencies:

- W1-02
- W1-03
- W1-04

### W1-08 Dev Smoke Checks

Purpose:
Catch integration issues early while the codebase is still small.

Scope:

- Add a lightweight smoke script for DB boot and provider wiring.
- Document required local runtime assumptions.

Deliverables:

- `scripts/dev-check.ts`

Acceptance criteria:

- Smoke check verifies DB connectivity.
- Smoke check verifies provider registry can instantiate the configured provider.

Dependencies:

- W1-02
- W1-05
- W1-06
- W1-07

## Week 2 Tickets

### W2-01 Settings API: Read and Save

Purpose:
Expose persisted local model settings to the UI.

Scope:

- Add `GET /api/settings/model`.
- Add `PUT /api/settings/model`.
- Validate input and return standard API envelopes.

Deliverables:

- `app/api/settings/model/route.ts`

Acceptance criteria:

- GET returns current saved settings or defaults.
- PUT saves valid settings and rejects invalid settings.
- No route-level database access bypasses the settings service.

Dependencies:

- W1-07
- W1-03
- W1-04

### W2-02 Settings API: Connection Test

Purpose:
Let the UI verify that the configured local model server is reachable.

Scope:

- Add `POST /api/settings/model/test`.
- Use provider registry to run `healthCheck`.
- Return actionable server/model availability status.

Deliverables:

- `app/api/settings/model-test/route.ts`

Acceptance criteria:

- Endpoint returns `serverReachable` and `modelAvailable`.
- Errors distinguish between unreachable server and missing model when possible.

Dependencies:

- W1-06
- W1-05
- W1-04

### W2-03 Settings API: Model Discovery

Purpose:
Allow users to discover locally installed models without manual typing where available.

Scope:

- Add `GET /api/settings/model/models`.
- Query the configured runtime for model names.

Deliverables:

- `app/api/settings/model-models/route.ts`

Acceptance criteria:

- Endpoint returns a stable list format.
- Empty model lists are handled gracefully.

Dependencies:

- W1-06
- W1-05

### W2-04 Settings Page UI

Purpose:
Give users a complete configuration surface for local model setup.

Scope:

- Build a dedicated settings page or settings section.
- Support editing:
  - provider
  - base URL
  - model
  - temperature
  - max tokens
  - timeout
- Add save action and optimistic loading states.

Deliverables:

- `app/settings/page.tsx`
- `components/settings/model-settings-form.tsx`

Acceptance criteria:

- User can load current settings into the form.
- User can edit and save settings.
- Validation errors are visible and specific.

Dependencies:

- W2-01
- W1-03

### W2-05 Model Test UX

Purpose:
Help users debug local runtime setup without reading logs.

Scope:

- Add a "Test connection" action in settings.
- Show result states for:
  - success
  - server unreachable
  - model missing
  - unknown failure

Deliverables:

- `components/settings/model-test-result.tsx`

Acceptance criteria:

- Test results are understandable without opening developer tools.
- User can retry the test without refreshing the page.

Dependencies:

- W2-02
- W2-04

### W2-06 Model Discovery UX

Purpose:
Reduce input friction by allowing model selection from discovered local models.

Scope:

- Add a "Load models" action.
- Populate model dropdown or picker from API results.
- Allow manual entry as fallback.

Deliverables:

- UI support in `model-settings-form.tsx`

Acceptance criteria:

- User can fetch and select an installed model.
- Manual model entry remains possible if discovery fails.

Dependencies:

- W2-03
- W2-04

### W2-07 Home Screen Blocked-State UX

Purpose:
Prevent users from attempting generation before the local runtime is configured.

Scope:

- Detect missing or invalid local model setup on the home screen.
- Disable generation entry point when setup is incomplete.
- Add a clear CTA to open settings.

Deliverables:

- Home page setup warning state

Acceptance criteria:

- User cannot accidentally start generation with no configured model.
- Blocked state explains exactly what needs to be configured.

Dependencies:

- W2-01
- W2-04

### W2-08 Local Runtime Setup Guidance

Purpose:
Make onboarding practical for users unfamiliar with local model tooling.

Scope:

- Add short setup guidance for Ollama.
- Include example base URL and model command examples as plain documentation text.
- Keep guidance local-runtime-specific and avoid cloud-provider language.

Deliverables:

- Setup helper text in settings or a short docs page

Acceptance criteria:

- A new user understands what to install, where the local endpoint usually runs, and what a valid model name looks like.

Dependencies:

- W2-04

### W2-09 Vertical Slice Review

Purpose:
Close Week 2 with a quality review before moving into lesson generation.

Scope:

- Verify route-handler thinness.
- Verify settings persistence.
- Verify connection test UX.
- Verify no cloud provider assumptions leaked into the setup flow.

Deliverables:

- Review checklist results

Acceptance criteria:

- Settings flow works end to end.
- Week 3 can start directly from a valid saved local model config.

Dependencies:

- W2-01
- W2-02
- W2-03
- W2-04
- W2-05
- W2-06
- W2-07
- W2-08

## Recommended Execution Order

1. W1-01 Project Skeleton
2. W1-02 SQLite Bootstrap
3. W1-03 Shared Types and API Envelopes
4. W1-04 Error and Logging Utilities
5. W1-05 LLM Provider Abstraction
6. W1-06 Ollama Provider Initial Implementation
7. W1-07 Settings Persistence Service
8. W1-08 Dev Smoke Checks
9. W2-01 Settings API: Read and Save
10. W2-02 Settings API: Connection Test
11. W2-03 Settings API: Model Discovery
12. W2-04 Settings Page UI
13. W2-05 Model Test UX
14. W2-06 Model Discovery UX
15. W2-07 Home Screen Blocked-State UX
16. W2-08 Local Runtime Setup Guidance
17. W2-09 Vertical Slice Review

## Suggested Owners

If one person is building:

- Week 1: architecture and backend foundation
- Week 2: settings APIs and frontend setup flow

If two people are building:

1. Engineer A
- DB bootstrap
- provider abstraction
- Ollama adapter
- settings services and APIs

2. Engineer B
- settings page
- model test UX
- model discovery UX
- home screen blocked state

## Exit Checklist for Week 2

- SQLite database initializes without manual steps beyond migration.
- Local model settings can be saved and reloaded.
- Ollama server connectivity can be tested successfully.
- Installed models can be listed or manually entered.
- The home screen prevents lesson generation when setup is incomplete.
- All setup messaging reflects a local-only architecture.

## Week 3 Entry Condition

Do not start outline generation work until Week 2 is complete. The outline pipeline depends on:

1. Stable persisted model settings
2. Provider registry access
3. Actionable connection errors
4. A working setup UX that blocks invalid generation attempts

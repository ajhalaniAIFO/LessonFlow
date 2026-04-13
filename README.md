# LessonFlow

LessonFlow is a local-LLM-first lesson generation app. It turns a prompt or uploaded
document into a structured lesson with:

- outline review before full generation
- scene-by-scene lesson navigation
- grounded tutor chat
- quizzes with grading and attempt history
- local SQLite persistence
- Ollama-based local model execution

## Beta Status

LessonFlow is in a strong MVP beta state.

What is working now:

- local model settings with Ollama connectivity checks
- prompt-based lesson creation
- document upload, extraction, and preview
- outline generation and outline review
- outline editing:
  - rename lesson
  - edit titles/goals
  - reorder items
  - add/remove items
  - change scene type
- full lesson scene generation
- lesson library with resume progress
- tutor chat tied to the current scene
- quiz generation, grading, and quiz history
- lesson regeneration and scene regeneration
- markdown lesson summary export
- automated test, build, CI, and browser smoke coverage

## Requirements

- Windows, macOS, or Linux with a recent Node.js installation
- npm
- Ollama installed locally
- at least one local model pulled in Ollama

Recommended:

- Node.js 22+
- a local Ollama model such as `llama3:latest` or another instruction-tuned model

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Start Ollama and pull a model if needed:

```bash
ollama pull llama3:latest
```

3. Start the app:

```bash
npm run dev
```

4. Open the app:

- [http://127.0.0.1:3000](http://127.0.0.1:3000)

5. Open `Settings` and configure:

- Base URL: `http://127.0.0.1:11434`
- Model: `llama3:latest` or your preferred local model

6. Test the connection and save settings.

7. Return home and generate a lesson.

## Typical User Flow

1. Enter a learning prompt or upload a document
2. Generate the lesson outline
3. Review and edit the outline
4. Continue into full scene generation
5. Study through scenes one at a time
6. Ask tutor questions
7. Complete quiz checkpoints
8. Reopen the lesson later from the library

## Scripts

- `npm run dev`: start the local development server
- `npm run build`: build the app for production
- `npm run start`: run the production build
- `npm run test`: run unit/service tests
- `npm run test:e2e`: run Playwright browser tests
- `npm run migrate`: run SQLite migrations
- `npm run dev-check`: smoke-check DB and provider wiring

## Testing

Current verification layers:

- unit and service tests with Vitest
- browser-level flows with Playwright
- GitHub Actions CI for install, test, and build

Current browser coverage includes:

- home page smoke path
- settings flow
- lesson request to outline review
- outline review to lesson page

## Data and Local Storage

LessonFlow stores local app data under `data/`, including:

- SQLite database files
- uploaded document artifacts
- dedicated E2E database state used by browser tests

Important:

- core lesson generation uses your configured local model
- no OpenAI or Gemini API key is required
- uploaded files stay local to your machine in this beta flow

## Troubleshooting

### Ollama returns HTTP 404

This usually means the configured model name does not exist in your local Ollama runtime.

Try:

```bash
ollama list
```

Then copy the exact model name into LessonFlow settings.

### Outline generation fails with JSON errors

LessonFlow already recovers from common local-model wrappers such as prose before JSON
or fenced JSON blocks. If failures still happen:

- try a more instruction-following local model
- simplify the prompt
- regenerate the lesson

### App feels slow

Local generation speed depends on your hardware and whether Ollama is using CPU or GPU.
Smaller models or more capable hardware generally improve responsiveness.

### `node` or `npm` is not recognized on Windows

Make sure Node is installed and that `C:\Program Files\nodejs` is available in your `PATH`.

### Browser E2E tests fail after a dev/build run

The Playwright setup uses an isolated dev server and dedicated database, but if local
artifacts get stale, rerun:

```bash
npm run test:e2e
npm run build
```

## Known Beta Limitations

- Ollama is the only runtime deeply supported today
- no voice, whiteboard, or simulation features yet
- browser tests cover the core journey, not every edge case
- rich export formats such as slides or PDF are not implemented yet
- lesson quality still depends heavily on the selected local model

## Project Structure

- `app/`: Next.js routes and API handlers
- `components/`: UI components grouped by feature
- `lib/db/`: SQLite client and migrations
- `lib/server/`: lesson logic, providers, validation, uploads, utilities
- `types/`: shared frontend/backend types
- `tests/`: Vitest tests and Playwright tests
- `prompts/`: prompt templates
- `scripts/`: utility scripts

## Beta Guide

For a short onboarding and troubleshooting guide, see:

- [docs/beta-guide.md](C:\Users\ajhalani\Desktop\pcln\LessonFlow\docs\beta-guide.md)

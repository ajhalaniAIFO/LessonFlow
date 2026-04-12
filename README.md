# LessonFlow

LessonFlow is a local-LLM-first lesson generation app.

## Current State

This repository is scaffolded for a clean MVP build with:

- thin API route boundaries
- server-side service modules
- a provider abstraction for local runtimes such as Ollama
- SQLite-backed persistence
- shared frontend/backend types

## Initial Architecture

- `app/`: application routes and API handlers
- `components/`: UI components grouped by feature
- `lib/db/`: SQLite client and migration helpers
- `lib/server/`: business logic, provider adapters, validation, and utilities
- `types/`: shared TypeScript contracts
- `prompts/`: prompt templates for lesson generation
- `data/`: local runtime data such as SQLite and uploaded files
- `scripts/`: development and migration scripts

## Build Sequence

1. Database bootstrap
2. Local model settings flow
3. Outline generation
4. Scene generation
5. Lesson viewer


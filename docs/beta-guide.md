# Beta Guide

## Who This Beta Is For

LessonFlow is best suited right now for users who:

- are comfortable running a local app
- have Ollama installed
- want private lesson generation without cloud model dependencies

## Recommended Setup

1. Install Node.js 22 or newer
2. Install Ollama
3. Pull a local model:

```bash
ollama pull llama3:latest
```

4. Start Ollama
5. Start LessonFlow:

```bash
npm install
npm run dev
```

6. Open:

- [http://127.0.0.1:3000](http://127.0.0.1:3000)

## First Run Checklist

1. Go to `Settings`
2. Confirm base URL is `http://127.0.0.1:11434`
3. Enter a valid local model name
4. Click `Test connection`
5. Click `Save settings`
6. Return home
7. Enter a learning request and generate an outline

## Best Results

To get more stable lesson generation:

- use an instruction-following local model
- keep prompts concrete
- review and edit the outline before continuing
- use scene regeneration if one section comes out weak

Example prompt:

`Teach me recursion from beginner to intermediate level with one short quiz near the end.`

## If Something Goes Wrong

### Connection test fails

Check:

- Ollama is running
- base URL is correct
- model name exists in `ollama list`

### Lesson generation fails

Try:

- regenerating the lesson
- shortening the prompt
- switching to a stronger local model

### Uploaded PDF extracts poorly

This beta uses local text extraction. Image-heavy or scanned PDFs may not extract cleanly.

### Browser tests or local dev runs feel inconsistent

LessonFlow now has isolated browser-test setup, but local Next artifacts can still get stale.
Rebuilding is the simplest recovery path:

```bash
npm run build
```

## What To Evaluate In The Beta

Good beta feedback areas:

- lesson quality for your chosen local model
- outline review usefulness
- tutor chat clarity
- quiz usefulness
- generation speed on your machine
- setup friction for first-time users

## Current Scope Boundaries

Included:

- local generation
- lesson outline review
- scene navigation
- tutor chat
- quizzes
- lesson library and regeneration

Not included yet:

- voice
- slides/PDF export
- collaborative use
- web research enrichment
- advanced multimodal lesson features

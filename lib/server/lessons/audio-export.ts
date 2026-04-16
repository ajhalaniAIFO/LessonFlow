import { promisify } from "node:util";
import { execFile as execFileCallback } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { buildLessonAudioPlaylist } from "@/lib/server/lessons/lesson-audio-playlist";
import { buildLessonSceneNarration, buildQuizSceneNarration } from "@/lib/server/lessons/scene-audio";
import { AppError } from "@/lib/server/utils/errors";
import type { Lesson } from "@/types/lesson";

const execFile = promisify(execFileCallback);

export type AudioExportScope = "scene" | "lesson";

export type AudioExportRequest = {
  scope: AudioExportScope;
  sceneId?: string;
};

type GenerateLessonAudioExportOptions = {
  platform?: NodeJS.Platform;
};

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "lesson";
}

function buildLessonPlaylistNarration(lesson: Lesson) {
  const playlist = buildLessonAudioPlaylist(lesson.scenes);
  return playlist
    .map((entry) => `Scene ${entry.sceneOrder}. ${entry.title}. ${entry.text}`)
    .join(". ");
}

export function buildLessonAudioExportPlan(lesson: Lesson, request: AudioExportRequest) {
  if (request.scope === "scene") {
    const scene = lesson.scenes.find((entry) => entry.id === request.sceneId);
    if (!scene || !scene.content) {
      throw new AppError("INVALID_REQUEST", "The requested scene is not available for audio export.");
    }

    const text =
      "summary" in scene.content
        ? buildLessonSceneNarration(scene.title, scene.content)
        : buildQuizSceneNarration(scene.title, scene.content);

    if (!text.trim()) {
      throw new AppError("INVALID_REQUEST", "The requested scene does not have narratable content yet.");
    }

    return {
      text,
      filename: `${slugify(lesson.title)}-scene-${scene.order}-${slugify(scene.title)}.wav`,
    };
  }

  const text = buildLessonPlaylistNarration(lesson);
  if (!text.trim()) {
    throw new AppError("INVALID_REQUEST", "This lesson does not have narratable content yet.");
  }

  return {
    text,
    filename: `${slugify(lesson.title)}-lesson-audio.wav`,
  };
}

export async function generateLessonAudioExport(
  lesson: Lesson,
  request: AudioExportRequest,
  options: GenerateLessonAudioExportOptions = {},
) {
  const platform = options.platform ?? process.platform;
  if (platform !== "win32") {
    throw new AppError(
      "INVALID_REQUEST",
      "Downloadable generated audio is currently available on Windows local installs only.",
    );
  }

  const plan = buildLessonAudioExportPlan(lesson, request);
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "lessonflow-audio-export-"));
  const outputPath = path.join(tempDir, plan.filename);
  const script = [
    "$ErrorActionPreference='Stop'",
    "Add-Type -AssemblyName System.Speech",
    "$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer",
    "try {",
    "  $synth.SetOutputToWaveFile($env:LESSONFLOW_AUDIO_OUTPUT)",
    "  $synth.Speak($env:LESSONFLOW_AUDIO_TEXT)",
    "} finally {",
    "  $synth.Dispose()",
    "}",
  ].join("; ");

  try {
    await execFile(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-Command", script],
      {
        windowsHide: true,
        env: {
          ...process.env,
          LESSONFLOW_AUDIO_OUTPUT: outputPath,
          LESSONFLOW_AUDIO_TEXT: plan.text,
        },
      },
    );

    const buffer = await readFile(outputPath);
    return {
      buffer,
      filename: plan.filename,
      contentType: "audio/wav",
    };
  } catch (error) {
    throw new AppError(
      "INTERNAL_ERROR",
      error instanceof Error ? error.message : "Unable to generate lesson audio export.",
    );
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

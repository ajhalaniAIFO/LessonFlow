import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { getDatabase } from "@/lib/db/client";
import { getProvider } from "@/lib/server/llm/provider-registry";
import { getModelSettings } from "@/lib/server/settings/settings-service";
import { AppError } from "@/lib/server/utils/errors";
import { getLessonById } from "@/lib/server/lessons/lesson-service";
import type { ChatMessage } from "@/types/chat";

type ChatRow = {
  id: string;
  lesson_id: string;
  role: ChatMessage["role"];
  content: string;
  created_at: number;
};

async function loadPromptTemplate() {
  const filePath = path.join(process.cwd(), "prompts", "tutor-chat.txt");
  return fs.readFile(filePath, "utf8");
}

function mapChatMessage(row: ChatRow): ChatMessage {
  return {
    id: row.id,
    lessonId: row.lesson_id,
    role: row.role,
    content: row.content,
    createdAt: row.created_at,
  };
}

export async function listChatMessages(lessonId: string): Promise<ChatMessage[]> {
  const db = getDatabase();
  const rows = db
    .prepare("SELECT * FROM chat_messages WHERE lesson_id = ? ORDER BY created_at ASC")
    .all(lessonId) as ChatRow[];
  return rows.map(mapChatMessage);
}

export async function sendTutorMessage(lessonId: string, content: string): Promise<ChatMessage> {
  const prompt = content.trim();
  if (!prompt) {
    throw new AppError("INVALID_REQUEST", "A chat message is required.");
  }

  const lesson = await getLessonById(lessonId);
  if (!lesson) {
    throw new AppError("INVALID_REQUEST", "Lesson not found.");
  }

  const settings = await getModelSettings();
  const provider = getProvider(settings.provider);
  const template = await loadPromptTemplate();
  const existingMessages = await listChatMessages(lessonId);
  const db = getDatabase();
  const now = Date.now();
  const userMessageId = randomUUID();

  db.prepare(
    `INSERT INTO chat_messages (id, lesson_id, role, content, created_at)
     VALUES (?, ?, ?, ?, ?)`,
  ).run(userMessageId, lessonId, "user", prompt, now);

  const lessonContext = [
    `Lesson title: ${lesson.title}`,
    `Lesson prompt: ${lesson.prompt ?? "No prompt provided."}`,
    `Outline: ${lesson.outline.map((item) => `${item.order}. ${item.title}`).join(" | ")}`,
    ...lesson.scenes.flatMap((scene) => {
      if (scene.type !== "lesson" || !scene.content || !("summary" in scene.content)) {
        return [];
      }

      return [`Scene ${scene.order}: ${scene.title} - ${scene.content.summary}`];
    }),
  ].join("\n");

  const transcript = existingMessages
    .slice(-6)
    .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
    .join("\n");

  const modelPrompt = `${template}

Lesson context:
${lessonContext}

Recent chat:
${transcript || "No prior chat."}

User question:
${prompt}`;

  const response = await provider.generateText({
    baseUrl: settings.baseUrl,
    model: settings.model,
    prompt: modelPrompt,
    temperature: settings.temperature,
    maxTokens: settings.maxTokens,
    timeoutMs: settings.timeoutMs,
  });

  const assistantMessageId = randomUUID();
  db.prepare(
    `INSERT INTO chat_messages (id, lesson_id, role, content, created_at)
     VALUES (?, ?, ?, ?, ?)`,
  ).run(assistantMessageId, lessonId, "assistant", response.text.trim(), Date.now());

  return {
    id: assistantMessageId,
    lessonId,
    role: "assistant",
    content: response.text.trim(),
    createdAt: Date.now(),
  };
}

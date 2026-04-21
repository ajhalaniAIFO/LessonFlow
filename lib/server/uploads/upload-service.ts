import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import pdfParse from "pdf-parse";
import { getDatabase } from "@/lib/db/client";
import { AppError } from "@/lib/server/utils/errors";
import type { UploadRecord } from "@/types/upload";

const PDF_EXTRACTION_TIMEOUT_MS = 15_000;

type UploadRow = {
  id: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  storage_path: string;
  extracted_text: string | null;
  extraction_status: UploadRecord["extractionStatus"];
  error_message: string | null;
};

function uploadsDir() {
  return path.join(process.cwd(), "data", "uploads");
}

function sanitizeFilename(filename: string) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "_");
}

async function extractText(
  filename: string,
  mimeType: string,
  buffer: Buffer,
  pdfTimeoutMs = PDF_EXTRACTION_TIMEOUT_MS,
): Promise<string> {
  const extension = path.extname(filename).toLowerCase();

  if (
    mimeType.startsWith("text/") ||
    [".txt", ".md", ".markdown", ".json", ".csv"].includes(extension)
  ) {
    return buffer.toString("utf8");
  }

  if (mimeType === "application/pdf" || extension === ".pdf") {
    const parsed = await Promise.race([
      pdfParse(buffer),
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(
            new AppError(
              "INVALID_REQUEST",
              "PDF text extraction took too long. Try a smaller PDF or convert it to text first.",
            ),
          );
        }, pdfTimeoutMs);
      }),
    ]);
    return parsed.text;
  }

  throw new AppError(
    "INVALID_REQUEST",
    "Unsupported file type. Use a text-based document or PDF.",
  );
}

function mapUpload(row: UploadRow): UploadRecord {
  return {
    id: row.id,
    filename: row.filename,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    extractionStatus: row.extraction_status,
    extractedText: row.extracted_text ?? undefined,
    storagePath: row.storage_path,
    errorMessage: row.error_message ?? undefined,
  };
}

export async function createUpload(
  file: File,
  options?: {
    pdfTimeoutMs?: number;
  },
): Promise<UploadRecord> {
  if (!file) {
    throw new AppError("INVALID_REQUEST", "A file is required.");
  }

  const id = randomUUID();
  const filename = sanitizeFilename(file.name || "upload");
  const outputDir = uploadsDir();
  await fs.mkdir(outputDir, { recursive: true });

  const storagePath = path.join(outputDir, `${id}-${filename}`);
  const bytes = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(storagePath, bytes);

  let extractedText = "";
  let extractionStatus: UploadRecord["extractionStatus"] = "ready";
  let errorMessage: string | null = null;

  try {
    extractedText = (
      await extractText(filename, file.type || "", bytes, options?.pdfTimeoutMs)
    ).trim();
    if (!extractedText) {
      throw new AppError("INVALID_REQUEST", "The uploaded document did not contain readable text.");
    }
  } catch (error) {
    extractionStatus = "error";
    errorMessage = error instanceof Error ? error.message : "Unable to extract document text.";
  }

  const now = Date.now();
  const db = getDatabase();
  db.prepare(
    `INSERT INTO uploads (id, filename, mime_type, size_bytes, storage_path, extracted_text, extraction_status, error_message, created_at, updated_at)
     VALUES (@id, @filename, @mime_type, @size_bytes, @storage_path, @extracted_text, @extraction_status, @error_message, @created_at, @updated_at)`,
  ).run({
    id,
    filename,
    mime_type: file.type || "application/octet-stream",
    size_bytes: file.size,
    storage_path: storagePath,
    extracted_text: extractedText || null,
    extraction_status: extractionStatus,
    error_message: errorMessage,
    created_at: now,
    updated_at: now,
  });

  const row = db.prepare("SELECT * FROM uploads WHERE id = ?").get(id) as UploadRow;
  return mapUpload(row);
}

export async function getUploadById(uploadId: string): Promise<UploadRecord | null> {
  const db = getDatabase();
  const row = db.prepare("SELECT * FROM uploads WHERE id = ?").get(uploadId) as UploadRow | undefined;
  return row ? mapUpload(row) : null;
}

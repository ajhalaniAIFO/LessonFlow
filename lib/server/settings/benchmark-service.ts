import { randomUUID } from "node:crypto";
import { getDatabase } from "@/lib/db/client";
import { getProvider } from "@/lib/server/llm/provider-registry";
import { parseModelSettings } from "@/lib/server/settings/settings-service";
import { AppError } from "@/lib/server/utils/errors";
import type {
  SyntheticBenchmarkComparisonItem,
  SyntheticBenchmarkRecord,
  SyntheticBenchmarkStatus,
} from "@/types/settings";

type BenchmarkRow = {
  id: string;
  provider: SyntheticBenchmarkRecord["provider"];
  model: string;
  base_url: string;
  benchmark_kind: SyntheticBenchmarkRecord["benchmarkKind"];
  status: SyntheticBenchmarkStatus;
  duration_ms: number | null;
  output_chars: number | null;
  output_preview: string | null;
  error_message: string | null;
  created_at: number;
};

const SYNTHETIC_BENCHMARK_PROMPT =
  "Reply with exactly one short sentence that says benchmark ready.";

function mapBenchmark(row: BenchmarkRow): SyntheticBenchmarkRecord {
  return {
    id: row.id,
    provider: row.provider,
    model: row.model,
    baseUrl: row.base_url,
    benchmarkKind: row.benchmark_kind,
    status: row.status,
    durationMs: row.duration_ms ?? undefined,
    outputChars: row.output_chars ?? undefined,
    outputPreview: row.output_preview ?? undefined,
    errorMessage: row.error_message ?? undefined,
    createdAt: row.created_at,
  };
}

function saveBenchmarkRecord(
  record: Omit<SyntheticBenchmarkRecord, "id"> & { id?: string },
) {
  const db = getDatabase();
  const id = record.id ?? randomUUID();
  db.prepare(
    `INSERT INTO runtime_benchmarks (
       id, provider, model, base_url, benchmark_kind, status, duration_ms,
       output_chars, output_preview, error_message, created_at
     ) VALUES (
       @id, @provider, @model, @base_url, @benchmark_kind, @status, @duration_ms,
       @output_chars, @output_preview, @error_message, @created_at
     )`,
  ).run({
    id,
    provider: record.provider,
    model: record.model,
    base_url: record.baseUrl,
    benchmark_kind: record.benchmarkKind,
    status: record.status,
    duration_ms: record.durationMs ?? null,
    output_chars: record.outputChars ?? null,
    output_preview: record.outputPreview ?? null,
    error_message: record.errorMessage ?? null,
    created_at: record.createdAt,
  });

  return { ...record, id };
}

export async function runSyntheticBenchmark(input: unknown): Promise<SyntheticBenchmarkRecord> {
  const settings = parseModelSettings(input);

  if (!settings.model.trim()) {
    throw new AppError("INVALID_REQUEST", "Save a model name before running a synthetic benchmark.");
  }

  const provider = getProvider(settings.provider);
  const startedAt = Date.now();

  try {
    const result = await provider.generateText({
      baseUrl: settings.baseUrl,
      model: settings.model,
      prompt: SYNTHETIC_BENCHMARK_PROMPT,
      temperature: 0.1,
      maxTokens: Math.min(settings.maxTokens, 64),
      timeoutMs: Math.min(settings.timeoutMs, 30_000),
    });

    const text = result.text.trim();
    return saveBenchmarkRecord({
      provider: settings.provider,
      model: settings.model,
      baseUrl: settings.baseUrl,
      benchmarkKind: "smoke_prompt",
      status: "success",
      durationMs: Date.now() - startedAt,
      outputChars: text.length,
      outputPreview: text.slice(0, 140),
      createdAt: Date.now(),
    });
  } catch (error) {
    return saveBenchmarkRecord({
      provider: settings.provider,
      model: settings.model,
      baseUrl: settings.baseUrl,
      benchmarkKind: "smoke_prompt",
      status: "error",
      durationMs: Date.now() - startedAt,
      errorMessage:
        error instanceof Error ? error.message : "Synthetic benchmark failed.",
      createdAt: Date.now(),
    });
  }
}

export async function listSyntheticBenchmarks(
  options?: {
    provider?: SyntheticBenchmarkRecord["provider"];
    model?: string;
    limit?: number;
  },
): Promise<SyntheticBenchmarkRecord[]> {
  const db = getDatabase();
  const limit = options?.limit ?? 5;

  if (options?.provider && options?.model) {
    const rows = db
      .prepare(
        `SELECT * FROM runtime_benchmarks
         WHERE provider = ? AND model = ?
         ORDER BY created_at DESC
         LIMIT ?`,
      )
      .all(options.provider, options.model, limit) as BenchmarkRow[];

    return rows.map(mapBenchmark);
  }

  const rows = db
    .prepare(
      `SELECT * FROM runtime_benchmarks
       ORDER BY created_at DESC
       LIMIT ?`,
    )
    .all(limit) as BenchmarkRow[];

  return rows.map(mapBenchmark);
}

export async function getSyntheticBenchmarkComparison(
  limit = 24,
): Promise<SyntheticBenchmarkComparisonItem[]> {
  const rows = await listSyntheticBenchmarks({ limit });
  const grouped = new Map<string, SyntheticBenchmarkRecord[]>();

  for (const row of rows) {
    if (row.status !== "success" || typeof row.durationMs !== "number") {
      continue;
    }

    const key = `${row.provider}::${row.model}`;
    const existing = grouped.get(key);
    if (existing) {
      existing.push(row);
    } else {
      grouped.set(key, [row]);
    }
  }

  return Array.from(grouped.entries())
    .map(([key, records]) => {
      const [provider, model] = key.split("::") as [
        SyntheticBenchmarkRecord["provider"],
        string,
      ];
      const durations = records
        .map((record) => record.durationMs)
        .filter((duration): duration is number => typeof duration === "number");
      const averageDurationMs = Math.round(
        durations.reduce((total, duration) => total + duration, 0) / durations.length,
      );

      return {
        provider,
        model,
        successfulRuns: records.length,
        averageDurationMs,
        fastestDurationMs: Math.min(...durations),
        slowestDurationMs: Math.max(...durations),
        latestCreatedAt: Math.max(...records.map((record) => record.createdAt)),
      };
    })
    .sort((left, right) => {
      if (left.averageDurationMs !== right.averageDurationMs) {
        return left.averageDurationMs - right.averageDurationMs;
      }

      if (left.successfulRuns !== right.successfulRuns) {
        return right.successfulRuns - left.successfulRuns;
      }

      return right.latestCreatedAt - left.latestCreatedAt;
    });
}

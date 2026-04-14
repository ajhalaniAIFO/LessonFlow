import { describe, expect, it } from "vitest";
import { getRuntimeComparisonSummary } from "@/lib/runtime/runtime-comparison";
import type { RuntimeComparisonItem } from "@/types/job";

describe("runtime-comparison", () => {
  it("returns a placeholder summary when there is no comparison data", () => {
    const summary = getRuntimeComparisonSummary([]);

    expect(summary.headline).toContain("Comparison will appear");
    expect(summary.best).toBeUndefined();
  });

  it("uses the first ranked item as the best recent local setup", () => {
    const items: RuntimeComparisonItem[] = [
      {
        runtimeProvider: "ollama",
        runtimeModel: "llama3:latest",
        completedJobs: 3,
        averageTotalMs: 12_000,
        fastestTotalMs: 9_000,
        slowestTotalMs: 15_000,
      },
    ];

    const summary = getRuntimeComparisonSummary(items);

    expect(summary.best?.runtimeModel).toBe("llama3:latest");
    expect(summary.summary).toContain("llama3:latest");
  });
});

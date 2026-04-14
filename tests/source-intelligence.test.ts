import { describe, expect, it } from "vitest";
import { buildSourceContext } from "@/lib/server/uploads/source-intelligence";

describe("source-intelligence", () => {
  it("selects a relevant excerpt and highlights from source text", () => {
    const context = buildSourceContext({
      lessonPrompt: "Teach me thermodynamics with a focus on heat transfer.",
      outlineTitle: "Heat transfer",
      outlineGoal: "Explain conduction, convection, and radiation.",
      sourceText: `
        Thermodynamics studies energy, heat, and work.

        Heat transfer can happen through conduction, convection, and radiation. These mechanisms explain how thermal energy moves between systems.

        Entropy describes disorder and the direction of spontaneous change.
      `,
    });

    expect(context?.excerpt).toContain("conduction, convection, and radiation");
    expect(context?.highlights).toContain("transfer");
    expect(context?.highlights).toContain("conduction");
    expect(context?.rationale).toContain("Heat transfer");
    expect(context?.emphasisLabel).toBe("Matched source terms");
  });

  it("returns undefined when no source text is available", () => {
    expect(
      buildSourceContext({
        lessonPrompt: "Teach me recursion",
        sourceText: "",
      }),
    ).toBeUndefined();
  });
});

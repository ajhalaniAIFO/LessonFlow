import { describe, expect, it } from "vitest";
import { buildLessonSceneNarration, buildQuizSceneNarration } from "@/lib/server/lessons/scene-audio";

describe("scene-audio", () => {
  it("builds readable narration for lesson scenes", () => {
    const narration = buildLessonSceneNarration("Energy basics", {
      summary: "This scene introduces energy transfer.",
      sections: [
        {
          heading: "Heat",
          body: "Heat moves because of temperature differences.",
          bullets: ["Heat is transfer", "Temperature drives flow"],
        },
      ],
      keyTakeaways: ["Energy is conserved", "Heat and work transfer energy"],
    });

    expect(narration).toContain("Energy basics");
    expect(narration).toContain("This scene introduces energy transfer.");
    expect(narration).toContain("Heat");
    expect(narration).toContain("Key points: Heat is transfer. Temperature drives flow");
    expect(narration).toContain("Key takeaways: Energy is conserved. Heat and work transfer energy");
  });

  it("builds readable narration for quiz scenes", () => {
    const narration = buildQuizSceneNarration("Quick check", {
      questions: [
        {
          id: "q1",
          prompt: "What does thermodynamics study?",
          type: "multiple_choice",
          options: ["Energy transfer", "Only gravity", "Only light"],
          correctIndex: 0,
          explanation: "It studies heat, work, and energy transfer.",
        },
      ],
    });

    expect(narration).toContain("Quick check");
    expect(narration).toContain("Question 1. What does thermodynamics study?");
    expect(narration).toContain("A. Energy transfer. B. Only gravity. C. Only light");
  });

  it("omits empty lesson parts gracefully", () => {
    const narration = buildLessonSceneNarration("Scene title", {
      summary: "  ",
      sections: [{ heading: "  ", body: "Core explanation." }],
      keyTakeaways: ["  ", "One useful takeaway"],
    });

    expect(narration).toBe("Scene title. Core explanation. Key takeaways: One useful takeaway");
  });
});

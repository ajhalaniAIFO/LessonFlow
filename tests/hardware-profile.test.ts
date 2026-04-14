import { describe, expect, it } from "vitest";
import {
  isLikelyAcceleratedGpuName,
  resolveHardwareTier,
} from "@/lib/runtime/hardware-profile";

describe("hardware-profile", () => {
  it("classifies entry hardware", () => {
    expect(resolveHardwareTier({ cpuCores: 4, totalMemoryGb: 8 })).toBe("entry");
  });

  it("classifies mid hardware", () => {
    expect(resolveHardwareTier({ cpuCores: 6, totalMemoryGb: 16 })).toBe("mid");
  });

  it("classifies strong hardware", () => {
    expect(resolveHardwareTier({ cpuCores: 12, totalMemoryGb: 32 })).toBe("strong");
  });

  it("recognizes likely accelerated GPU names", () => {
    expect(isLikelyAcceleratedGpuName("NVIDIA GeForce RTX 4070")).toBe(true);
    expect(isLikelyAcceleratedGpuName("AMD Radeon RX 7800 XT")).toBe(true);
    expect(isLikelyAcceleratedGpuName("Microsoft Basic Display Adapter")).toBe(false);
  });
});

import os from "node:os";

export type HardwareTier = "entry" | "mid" | "strong";

export type HardwareProfile = {
  cpuCores: number;
  totalMemoryGb: number;
  platform: NodeJS.Platform;
  tier: HardwareTier;
};

export function resolveHardwareTier(input: {
  cpuCores: number;
  totalMemoryGb: number;
}): HardwareTier {
  if (input.cpuCores >= 8 && input.totalMemoryGb >= 24) {
    return "strong";
  }

  if (input.cpuCores >= 6 && input.totalMemoryGb >= 12) {
    return "mid";
  }

  return "entry";
}

export function getHardwareProfile(): HardwareProfile {
  const cpuCores = os.cpus().length;
  const totalMemoryGb = Math.round((os.totalmem() / 1024 ** 3) * 10) / 10;

  return {
    cpuCores,
    totalMemoryGb,
    platform: os.platform(),
    tier: resolveHardwareTier({
      cpuCores,
      totalMemoryGb,
    }),
  };
}

import os from "node:os";
import { spawnSync } from "node:child_process";

export type HardwareTier = "entry" | "mid" | "strong";

export type HardwareProfile = {
  cpuCores: number;
  totalMemoryGb: number;
  platform: NodeJS.Platform;
  tier: HardwareTier;
  likelyGpuAvailable: boolean;
  gpuNames: string[];
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

export function isLikelyAcceleratedGpuName(name: string) {
  const normalized = name.trim().toLowerCase();

  if (!normalized || normalized.includes("microsoft basic")) {
    return false;
  }

  return [
    "nvidia",
    "geforce",
    "rtx",
    "gtx",
    "quadro",
    "tesla",
    "radeon",
    "amd",
    "intel arc",
    "apple",
    "m1",
    "m2",
    "m3",
    "m4",
  ].some((token) => normalized.includes(token));
}

function detectWindowsGpuNames() {
  const result = spawnSync(
    "powershell.exe",
    [
      "-NoProfile",
      "-Command",
      "Get-CimInstance Win32_VideoController | Select-Object -ExpandProperty Name",
    ],
    {
      encoding: "utf8",
      timeout: 1500,
      windowsHide: true,
    },
  );

  if (result.status !== 0 || !result.stdout) {
    return [];
  }

  return result.stdout
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function detectGpuNames(platform: NodeJS.Platform) {
  if (platform === "win32") {
    return detectWindowsGpuNames();
  }

  return [];
}

export function getHardwareProfile(): HardwareProfile {
  const cpuCores = os.cpus().length;
  const totalMemoryGb = Math.round((os.totalmem() / 1024 ** 3) * 10) / 10;
  const platform = os.platform();
  const gpuNames = detectGpuNames(platform);
  const likelyGpuAvailable = gpuNames.some(isLikelyAcceleratedGpuName);

  return {
    cpuCores,
    totalMemoryGb,
    platform,
    tier: resolveHardwareTier({
      cpuCores,
      totalMemoryGb,
    }),
    likelyGpuAvailable,
    gpuNames,
  };
}

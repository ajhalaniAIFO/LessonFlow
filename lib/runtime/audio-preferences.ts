export const AUDIO_PREFERENCES_KEY = "lessonflow.audioPreferences";

export const AUDIO_SPEED_OPTIONS = ["0.9", "1", "1.15"] as const;

export type AudioSpeedOption = (typeof AUDIO_SPEED_OPTIONS)[number];

export type AudioPreferences = {
  voiceURI: string;
  rate: AudioSpeedOption;
};

export const DEFAULT_AUDIO_PREFERENCES: AudioPreferences = {
  voiceURI: "",
  rate: "1",
};

export function parseAudioPreferences(input: unknown): AudioPreferences {
  if (!input || typeof input !== "object") {
    return DEFAULT_AUDIO_PREFERENCES;
  }

  const candidate = input as Record<string, unknown>;
  const voiceURI =
    typeof candidate.voiceURI === "string" ? candidate.voiceURI.trim() : DEFAULT_AUDIO_PREFERENCES.voiceURI;
  const rate = AUDIO_SPEED_OPTIONS.includes(candidate.rate as AudioSpeedOption)
    ? (candidate.rate as AudioSpeedOption)
    : DEFAULT_AUDIO_PREFERENCES.rate;

  return {
    voiceURI,
    rate,
  };
}

export function serializeAudioPreferences(preferences: AudioPreferences) {
  return JSON.stringify(preferences);
}

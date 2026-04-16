import { describe, expect, it } from "vitest";
import {
  DEFAULT_AUDIO_PREFERENCES,
  parseAudioPreferences,
  serializeAudioPreferences,
} from "@/lib/runtime/audio-preferences";

describe("audio-preferences", () => {
  it("returns defaults for invalid input", () => {
    expect(parseAudioPreferences(undefined)).toEqual(DEFAULT_AUDIO_PREFERENCES);
    expect(parseAudioPreferences(null)).toEqual(DEFAULT_AUDIO_PREFERENCES);
    expect(parseAudioPreferences("bad")).toEqual(DEFAULT_AUDIO_PREFERENCES);
  });

  it("keeps valid persisted values", () => {
    expect(
      parseAudioPreferences({
        voiceURI: "voice-1",
        rate: "1.15",
      }),
    ).toEqual({
      voiceURI: "voice-1",
      rate: "1.15",
    });
  });

  it("falls back when the saved rate is unsupported", () => {
    expect(
      parseAudioPreferences({
        voiceURI: "voice-1",
        rate: "2",
      }),
    ).toEqual({
      voiceURI: "voice-1",
      rate: "1",
    });
  });

  it("serializes preferences for local storage", () => {
    expect(
      serializeAudioPreferences({
        voiceURI: "voice-1",
        rate: "0.9",
      }),
    ).toBe('{"voiceURI":"voice-1","rate":"0.9"}');
  });
});

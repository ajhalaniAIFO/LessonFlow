"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  clearLessonAudioResume,
  isLessonAudioResumeTarget,
  reportLessonAudioSession,
  isLessonAudioStopDetail,
  LESSON_AUDIO_RESUME_REQUEST_EVENT,
  LESSON_AUDIO_STOP_EVENT,
  requestLessonAudioStop,
  suggestLessonAudioResume,
} from "@/lib/runtime/audio-coordination";
import {
  AUDIO_PREFERENCES_KEY,
  AUDIO_SPEED_OPTIONS,
  DEFAULT_AUDIO_PREFERENCES,
  type AudioSpeedOption,
  parseAudioPreferences,
  serializeAudioPreferences,
} from "@/lib/runtime/audio-preferences";
import {
  LESSON_AUDIO_RESUME_STORAGE_KEY,
  serializeLessonAudioResume,
} from "@/lib/runtime/audio-resume";

type SpeechVoiceLike = SpeechSynthesisVoice;
type AudioState = "idle" | "playing" | "paused";

type Props = {
  lessonId: string;
  sceneId: string;
  sceneOrder: number;
  title: string;
  text: string;
  audioMode?: boolean;
};

export function SceneAudioPlayer({
  lessonId,
  sceneId,
  sceneOrder,
  title,
  text,
  audioMode = false,
}: Props) {
  const [supported, setSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechVoiceLike[]>([]);
  const [voiceURI, setVoiceURI] = useState(DEFAULT_AUDIO_PREFERENCES.voiceURI);
  const [rate, setRate] = useState<AudioSpeedOption>(DEFAULT_AUDIO_PREFERENCES.rate);
  const [state, setState] = useState<AudioState>("idle");
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const storedPreferences = window.localStorage.getItem(AUDIO_PREFERENCES_KEY);
      if (!storedPreferences) {
        return;
      }

      const parsed = parseAudioPreferences(JSON.parse(storedPreferences));
      setVoiceURI(parsed.voiceURI);
      setRate(parsed.rate);
    } catch {
      setVoiceURI(DEFAULT_AUDIO_PREFERENCES.voiceURI);
      setRate(DEFAULT_AUDIO_PREFERENCES.rate);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    setSupported(true);
    const synth = window.speechSynthesis;

    const syncVoices = () => {
      const availableVoices = synth.getVoices();
      setVoices(availableVoices);

      if (voiceURI && !availableVoices.some((voice) => voice.voiceURI === voiceURI) && availableVoices[0]) {
        setVoiceURI(availableVoices[0].voiceURI);
        return;
      }

      if (!voiceURI && availableVoices[0]) {
        setVoiceURI(availableVoices[0].voiceURI);
      }
    };

    syncVoices();
    synth.addEventListener("voiceschanged", syncVoices);

    return () => {
      synth.cancel();
      synth.removeEventListener("voiceschanged", syncVoices);
    };
  }, [voiceURI]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleStopRequest = (event: Event) => {
      if (!(event instanceof CustomEvent) || !isLessonAudioStopDetail(event.detail) || event.detail.source === "scene") {
        return;
      }

      if (state !== "idle" && (event.detail.source === "tutor-input" || event.detail.source === "tutor-reply")) {
        const target = {
          lessonId,
          source: "scene" as const,
          sceneId,
          sceneOrder,
          title,
        };

        window.localStorage.setItem(LESSON_AUDIO_RESUME_STORAGE_KEY, serializeLessonAudioResume(target));
        suggestLessonAudioResume(window, target);
      }

      window.speechSynthesis.cancel();
      utteranceRef.current = null;
      reportLessonAudioSession(window, {
        lessonId,
        owner: "idle",
        state: "idle",
      });
      setState("idle");
    };

    const handleResumeRequest = (event: Event) => {
      if (!(event instanceof CustomEvent) || !isLessonAudioResumeTarget(event.detail)) {
        return;
      }

      if (event.detail.lessonId === lessonId && event.detail.source === "scene" && event.detail.sceneId === sceneId) {
        speakFromStart();
      }
    };

    window.addEventListener(LESSON_AUDIO_STOP_EVENT, handleStopRequest);
    window.addEventListener(LESSON_AUDIO_RESUME_REQUEST_EVENT, handleResumeRequest);

    return () => {
      window.removeEventListener(LESSON_AUDIO_STOP_EVENT, handleStopRequest);
      window.removeEventListener(LESSON_AUDIO_RESUME_REQUEST_EVENT, handleResumeRequest);
    };
  }, [lessonId, sceneId, sceneOrder, state, title]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      AUDIO_PREFERENCES_KEY,
      serializeAudioPreferences({
        voiceURI,
        rate,
      }),
    );
  }, [rate, voiceURI]);

  const selectedVoice = useMemo(
    () => voices.find((voice) => voice.voiceURI === voiceURI) ?? null,
    [voiceURI, voices],
  );

  function speakFromStart() {
    if (typeof window === "undefined" || !supported || !text.trim()) {
      return;
    }

    clearLessonAudioResume(window);
    window.localStorage.removeItem(LESSON_AUDIO_RESUME_STORAGE_KEY);
    requestLessonAudioStop(window, {
      source: "scene",
      reason: "start-playback",
    });

    const synth = window.speechSynthesis;
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = selectedVoice;
    utterance.rate = Number(rate);
    utterance.onend = () => {
      utteranceRef.current = null;
      reportLessonAudioSession(window, {
        lessonId,
        owner: "idle",
        state: "idle",
      });
      setState("idle");
    };
    utterance.onerror = () => {
      utteranceRef.current = null;
      reportLessonAudioSession(window, {
        lessonId,
        owner: "idle",
        state: "idle",
      });
      setState("idle");
    };

    utteranceRef.current = utterance;
    reportLessonAudioSession(window, {
      lessonId,
      owner: "scene",
      state: "playing",
      title,
      sceneOrder,
    });
    setState("playing");
    synth.speak(utterance);
  }

  function pauseOrResume() {
    if (!supported || typeof window === "undefined") {
      return;
    }

    const synth = window.speechSynthesis;

    if (state === "playing" && synth.speaking && !synth.paused) {
      synth.pause();
      reportLessonAudioSession(window, {
        lessonId,
        owner: "scene",
        state: "paused",
        title,
        sceneOrder,
      });
      setState("paused");
      return;
    }

    if (state === "paused" && synth.paused) {
      synth.resume();
      reportLessonAudioSession(window, {
        lessonId,
        owner: "scene",
        state: "playing",
        title,
        sceneOrder,
      });
      setState("playing");
    }
  }

  function stopPlayback() {
    if (!supported || typeof window === "undefined") {
      return;
    }

    window.speechSynthesis.cancel();
    utteranceRef.current = null;
    reportLessonAudioSession(window, {
      lessonId,
      owner: "idle",
      state: "idle",
    });
    setState("idle");
  }

  if (!text.trim()) {
    return null;
  }

  return (
    <section className="scene-audio-card" aria-label={`Audio controls for ${title}`}>
      <div className="scene-audio-header">
        <div>
          <p className="scene-audio-title">Listen to this scene</p>
          <p className="status-copy">
            {audioMode
              ? "Use quick scene playback when you want to rehear this step without leaving the broader listening flow."
              : "Use browser narration to hear this scene out loud while you follow along."}
          </p>
        </div>
        <span className={`recommendation-badge ${supported ? "success" : "muted"}`}>
          {supported
            ? state === "playing"
              ? "Now listening"
              : state === "paused"
                ? "Paused"
                : audioMode
                  ? "Scene ready"
                  : "Audio ready"
            : "Audio unavailable"}
        </span>
      </div>

      {supported ? (
        <>
          <div className="scene-audio-controls">
            <label className="field">
              <span>Voice</span>
              <select value={voiceURI} onChange={(event) => setVoiceURI(event.target.value)}>
                {voices.length ? (
                  voices.map((voice) => (
                    <option key={voice.voiceURI} value={voice.voiceURI}>
                      {voice.name} {voice.lang ? `(${voice.lang})` : ""}
                    </option>
                  ))
                ) : (
                  <option value="">Default browser voice</option>
                )}
              </select>
            </label>

            <label className="field">
              <span>Speed</span>
              <select value={rate} onChange={(event) => setRate(event.target.value as AudioSpeedOption)}>
                {AUDIO_SPEED_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option === "0.9" ? "Slower" : option === "1" ? "Normal" : "Faster"}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="button-row">
            <button className="button primary" type="button" onClick={speakFromStart}>
              {state === "idle" ? "Play narration" : "Restart narration"}
            </button>
            <button
              className="button secondary"
              type="button"
              onClick={pauseOrResume}
              disabled={state === "idle"}
            >
              {state === "paused" ? "Resume" : "Pause"}
            </button>
            <button
              className="button secondary"
              type="button"
              onClick={stopPlayback}
              disabled={state === "idle"}
            >
              Stop
            </button>
          </div>

          <p className="field-hint">Voice and speed preferences are saved on this device for future scenes.</p>
        </>
      ) : (
        <div className="status-box">
          <p className="status-title">Browser narration is not available here</p>
          <p className="status-copy">
            This audio MVP uses the browser&apos;s built-in speech engine, so support depends on the device and browser.
          </p>
        </div>
      )}
    </section>
  );
}

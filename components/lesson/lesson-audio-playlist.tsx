"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  isLessonAudioStopDetail,
  LESSON_AUDIO_STOP_EVENT,
  requestLessonAudioStop,
} from "@/lib/runtime/audio-coordination";
import {
  AUDIO_PREFERENCES_KEY,
  DEFAULT_AUDIO_PREFERENCES,
  parseAudioPreferences,
} from "@/lib/runtime/audio-preferences";
import type { LessonAudioPlaylistEntry } from "@/lib/server/lessons/lesson-audio-playlist";

type Props = {
  lessonId: string;
  activeSceneId?: string;
  entries: LessonAudioPlaylistEntry[];
};

export function LessonAudioPlaylist({ lessonId, activeSceneId, entries }: Props) {
  const router = useRouter();
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [supported, setSupported] = useState(false);
  const [currentSceneId, setCurrentSceneId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [voiceURI, setVoiceURI] = useState(DEFAULT_AUDIO_PREFERENCES.voiceURI);
  const [rate, setRate] = useState(DEFAULT_AUDIO_PREFERENCES.rate);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!("speechSynthesis" in window)) {
      setSupported(false);
      return;
    }

    setSupported(true);

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

    return () => {
      window.speechSynthesis.cancel();
      utteranceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleStopRequest = (event: Event) => {
      if (
        !(event instanceof CustomEvent) ||
        !isLessonAudioStopDetail(event.detail) ||
        event.detail.source === "playlist"
      ) {
        return;
      }

      window.speechSynthesis.cancel();
      utteranceRef.current = null;
      setCurrentSceneId(null);
      setIsPlaying(false);
    };

    window.addEventListener(LESSON_AUDIO_STOP_EVENT, handleStopRequest);

    return () => {
      window.removeEventListener(LESSON_AUDIO_STOP_EVENT, handleStopRequest);
    };
  }, []);

  const startIndex = useMemo(() => {
    const activeIndex = entries.findIndex((entry) => entry.sceneId === activeSceneId);
    return activeIndex >= 0 ? activeIndex : 0;
  }, [activeSceneId, entries]);

  function stopPlaylist() {
    if (typeof window === "undefined") {
      return;
    }

    window.speechSynthesis.cancel();
    utteranceRef.current = null;
    setCurrentSceneId(null);
    setIsPlaying(false);
  }

  function playEntryAt(index: number) {
    if (typeof window === "undefined" || !supported) {
      return;
    }

    requestLessonAudioStop(window, {
      source: "playlist",
      reason: "start-playback",
    });

    const entry = entries[index];
    if (!entry) {
      stopPlaylist();
      return;
    }

    const synth = window.speechSynthesis;
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(entry.text);
    const selectedVoice = synth.getVoices().find((voice) => voice.voiceURI === voiceURI);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    utterance.rate = Number(rate);
    utterance.onend = () => {
      const nextEntry = entries[index + 1];
      if (!nextEntry) {
        stopPlaylist();
        return;
      }

      router.push(`/lessons/${lessonId}?scene=${nextEntry.sceneOrder}`);
      playEntryAt(index + 1);
    };
    utterance.onerror = () => {
      stopPlaylist();
    };

    utteranceRef.current = utterance;
    setCurrentSceneId(entry.sceneId);
    setIsPlaying(true);
    router.push(`/lessons/${lessonId}?scene=${entry.sceneOrder}`);
    synth.speak(utterance);
  }

  if (!entries.length) {
    return null;
  }

  const currentEntry = entries.find((entry) => entry.sceneId === currentSceneId) ?? null;

  return (
    <section className="lesson-audio-playlist-card">
      <div className="lesson-audio-playlist-header">
        <div>
          <p className="scene-audio-title">Lesson audio playlist</p>
          <p className="status-copy">
            Start from this scene and continue through the remaining lesson with your saved narration settings.
          </p>
        </div>
        <span className={`recommendation-badge ${supported ? "success" : "muted"}`}>
          {supported ? "Playlist ready" : "Playlist unavailable"}
        </span>
      </div>

      {supported ? (
        <>
          <div className="button-row">
            <button className="button primary" type="button" onClick={() => playEntryAt(startIndex)}>
              {isPlaying ? "Restart from this scene" : "Play from this scene"}
            </button>
            <button className="button secondary" type="button" onClick={stopPlaylist} disabled={!isPlaying}>
              Stop playlist
            </button>
          </div>
          <p className="field-hint">
            {currentEntry
              ? `Now playing scene ${currentEntry.sceneOrder}: ${currentEntry.title}`
              : `Playlist will start at scene ${entries[startIndex]?.sceneOrder ?? 1}.`}
          </p>
        </>
      ) : (
        <div className="status-box">
          <p className="status-title">Lesson playlist audio is not available here</p>
          <p className="status-copy">
            This playlist relies on the browser&apos;s built-in speech engine, so support depends on the device and browser.
          </p>
        </div>
      )}
    </section>
  );
}

"use client";

import { useEffect, useState } from "react";
import { SceneAudioPlayer } from "@/components/lesson/scene-audio-player";
import { SourceTraceCard } from "@/components/lesson/source-trace-card";
import { buildQuizSceneNarration } from "@/lib/server/lessons/scene-audio";
import type { ApiResponse } from "@/types/api";
import type { QuizAnswerResult, QuizAttempt, QuizSceneContent } from "@/types/scene";

type GradeResponse = {
  attemptId: string;
  results: QuizAnswerResult[];
  score: {
    correct: number;
    total: number;
  };
};

type Props = {
  lessonId: string;
  sceneId: string;
  sceneOrder: number;
  title: string;
  content: QuizSceneContent;
};

export function QuizSceneClient({ lessonId, sceneId, sceneOrder, title, content }: Props) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<GradeResponse | null>(null);
  const [history, setHistory] = useState<QuizAttempt[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadHistory() {
      const response = await fetch(`/api/lessons/${lessonId}/quizzes/${sceneId}/grade`, {
        cache: "no-store",
      });
      const payload = (await response.json()) as ApiResponse<{ attempts: QuizAttempt[] }>;

      if (active && payload.success) {
        setHistory(payload.data.attempts);
      }
    }

    void loadHistory();
    return () => {
      active = false;
    };
  }, [lessonId, sceneId]);

  async function handleSubmit() {
    setIsSubmitting(true);
    setError(null);

    const response = await fetch(`/api/lessons/${lessonId}/quizzes/${sceneId}/grade`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        answers: Object.entries(answers).map(([questionId, selectedIndex]) => ({
          questionId,
          selectedIndex,
        })),
      }),
    });

    const payload = (await response.json()) as ApiResponse<GradeResponse>;
    setIsSubmitting(false);

    if (!payload.success) {
      setError(payload.error.message);
      return;
    }

    setResult(payload.data);
    setHistory((current) => [
      {
        id: payload.data.attemptId,
        sceneId,
        score: payload.data.score,
        results: payload.data.results,
        createdAt: Date.now(),
      },
      ...current,
    ]);
  }

  return (
    <article style={{ marginBottom: "20px" }}>
      <h3>{title}</h3>
      <SceneAudioPlayer
        lessonId={lessonId}
        sceneId={sceneId}
        sceneOrder={sceneOrder}
        title={title}
        text={buildQuizSceneNarration(title, content)}
      />
      {content.questions.map((question, index) => {
        const questionResult = result?.results.find((item) => item.questionId === question.id);
        return (
          <div key={question.id} style={{ marginBottom: "18px" }}>
            <strong>
              Q{index + 1}. {question.prompt}
            </strong>
            <div style={{ display: "grid", gap: "8px", marginTop: "10px" }}>
              {question.options.map((option, optionIndex) => (
                <label key={option} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                  <input
                    type="radio"
                    name={question.id}
                    checked={answers[question.id] === optionIndex}
                    onChange={() =>
                      setAnswers((current) => ({
                        ...current,
                        [question.id]: optionIndex,
                      }))
                    }
                    disabled={isSubmitting}
                  />
                  <span>
                    {String.fromCharCode(65 + optionIndex)}. {option}
                  </span>
                </label>
              ))}
            </div>
            {questionResult ? (
              <div className={`status-box ${questionResult.correct ? "success" : "error"}`}>
                <p className="status-title">
                  {questionResult.correct ? "Correct" : "Needs review"}
                </p>
                <p className="status-copy">
                  Correct answer: {String.fromCharCode(65 + questionResult.correctIndex)}.{" "}
                  {questionResult.explanation}
                </p>
              </div>
            ) : null}
          </div>
        );
      })}

      <div className="button-row">
        <button className="button primary" type="button" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Checking..." : "Submit answers"}
        </button>
      </div>

      {result ? (
        <div className="status-box success">
          <p className="status-title">Score</p>
          <p className="status-copy">
            You answered {result.score.correct} out of {result.score.total} correctly.
          </p>
        </div>
      ) : null}

      {error ? (
        <div className="status-box error">
          <p className="status-title">Unable to grade quiz</p>
          <p className="status-copy">{error}</p>
        </div>
      ) : null}

      {content.sourceContext ? (
        <SourceTraceCard sourceContext={content.sourceContext} sceneType="quiz" />
      ) : null}

      {history.length > 0 ? (
        <div className="status-box">
          <p className="status-title">Previous attempts</p>
          {history.slice(0, 3).map((attempt) => (
            <div key={attempt.id} style={{ marginBottom: "12px" }}>
              <p className="status-copy">
                {new Date(attempt.createdAt).toLocaleString()} — {attempt.score.correct}/{attempt.score.total} correct
              </p>
              {attempt.results.map((entry) => (
                <p key={entry.questionId} className="field-hint" style={{ margin: "4px 0 0" }}>
                  {entry.correct ? "Correct" : "Review"}: {entry.explanation}
                </p>
              ))}
            </div>
          ))}
        </div>
      ) : null}
    </article>
  );
}

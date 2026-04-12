"use client";

import { useState } from "react";
import type { ApiResponse } from "@/types/api";
import type { QuizAnswerResult, QuizSceneContent } from "@/types/scene";

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
  title: string;
  content: QuizSceneContent;
};

export function QuizSceneClient({ lessonId, sceneId, title, content }: Props) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<GradeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  }

  return (
    <article style={{ marginBottom: "20px" }}>
      <h3>{title}</h3>
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
    </article>
  );
}

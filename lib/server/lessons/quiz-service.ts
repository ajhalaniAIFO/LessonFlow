import { randomUUID } from "node:crypto";
import { getDatabase } from "@/lib/db/client";
import { AppError } from "@/lib/server/utils/errors";
import type {
  QuizAnswerResult,
  QuizAnswerSubmission,
  QuizAttempt,
  QuizSceneContent,
} from "@/types/scene";

type GradeQuizInput = {
  lessonId: string;
  sceneId: string;
  answers: QuizAnswerSubmission[];
};

type AttemptRow = {
  id: string;
  lesson_id: string;
  scene_id: string;
  score_correct: number;
  score_total: number;
  created_at: number;
};

type AnswerRow = {
  attempt_id: string;
  question_id: string;
  selected_index: number;
  correct_index: number;
  is_correct: number;
  explanation: string;
};

function isQuizSceneContent(content: unknown): content is QuizSceneContent {
  return (
    typeof content === "object" &&
    content !== null &&
    "questions" in content &&
    Array.isArray((content as QuizSceneContent).questions)
  );
}

export function gradeQuizAnswers(input: GradeQuizInput) {
  const db = getDatabase();
  const scene = db
    .prepare("SELECT content_json FROM scenes WHERE id = ? AND lesson_id = ? AND type = 'quiz'")
    .get(input.sceneId, input.lessonId) as { content_json: string | null } | undefined;

  if (!scene?.content_json) {
    throw new AppError("INVALID_REQUEST", "Quiz scene not found.");
  }

  const parsed = JSON.parse(scene.content_json) as unknown;
  if (!isQuizSceneContent(parsed)) {
    throw new AppError("INTERNAL_ERROR", "Stored quiz scene content is invalid.");
  }

  const results: QuizAnswerResult[] = parsed.questions.map((question) => {
    const submitted = input.answers.find((answer) => answer.questionId === question.id);
    const selectedIndex = submitted?.selectedIndex ?? -1;
    return {
      questionId: question.id,
      selectedIndex,
      correctIndex: question.correctIndex,
      correct: selectedIndex === question.correctIndex,
      explanation: question.explanation,
    };
  });

  const scoreCorrect = results.filter((result) => result.correct).length;
  const scoreTotal = results.length;
  const attemptId = randomUUID();
  const now = Date.now();

  db.prepare(
    `INSERT INTO quiz_attempts (id, lesson_id, scene_id, score_correct, score_total, created_at)
     VALUES (@id, @lesson_id, @scene_id, @score_correct, @score_total, @created_at)`,
  ).run({
    id: attemptId,
    lesson_id: input.lessonId,
    scene_id: input.sceneId,
    score_correct: scoreCorrect,
    score_total: scoreTotal,
    created_at: now,
  });

  const insertAnswer = db.prepare(
    `INSERT INTO quiz_answers (id, attempt_id, question_id, selected_index, correct_index, is_correct, explanation, created_at)
     VALUES (@id, @attempt_id, @question_id, @selected_index, @correct_index, @is_correct, @explanation, @created_at)`,
  );

  results.forEach((result) => {
    insertAnswer.run({
      id: randomUUID(),
      attempt_id: attemptId,
      question_id: result.questionId,
      selected_index: result.selectedIndex,
      correct_index: result.correctIndex,
      is_correct: result.correct ? 1 : 0,
      explanation: result.explanation,
      created_at: now,
    });
  });

  return {
    attemptId,
    results,
    score: {
      correct: scoreCorrect,
      total: scoreTotal,
    },
  };
}

export function listQuizAttempts(lessonId: string, sceneId: string): QuizAttempt[] {
  const db = getDatabase();
  const attempts = db
    .prepare(
      `SELECT * FROM quiz_attempts
       WHERE lesson_id = ? AND scene_id = ?
       ORDER BY created_at DESC`,
    )
    .all(lessonId, sceneId) as AttemptRow[];

  if (attempts.length === 0) {
    return [];
  }

  const answers = db
    .prepare(
      `SELECT attempt_id, question_id, selected_index, correct_index, is_correct, explanation
       FROM quiz_answers
       WHERE attempt_id IN (${attempts.map(() => "?").join(", ")})
       ORDER BY created_at ASC`,
    )
    .all(...attempts.map((attempt) => attempt.id)) as AnswerRow[];

  return attempts.map((attempt) => ({
    id: attempt.id,
    sceneId: attempt.scene_id,
    score: {
      correct: attempt.score_correct,
      total: attempt.score_total,
    },
    results: answers
      .filter((answer) => answer.attempt_id === attempt.id)
      .map((answer) => ({
        questionId: answer.question_id,
        selectedIndex: answer.selected_index,
        correctIndex: answer.correct_index,
        correct: answer.is_correct === 1,
        explanation: answer.explanation,
      })),
    createdAt: attempt.created_at,
  }));
}

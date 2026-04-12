import { randomUUID } from "node:crypto";
import { getDatabase } from "@/lib/db/client";
import { AppError } from "@/lib/server/utils/errors";
import type { QuizAnswerResult, QuizAnswerSubmission, QuizSceneContent } from "@/types/scene";

type GradeQuizInput = {
  lessonId: string;
  sceneId: string;
  answers: QuizAnswerSubmission[];
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

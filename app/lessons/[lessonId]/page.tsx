import type { Route } from "next";
import Link from "next/link";
import { InteractiveBlockCard } from "@/components/lesson/interactive-block-card";
import { AudioFirstStatusCard } from "@/components/lesson/audio-first-status-card";
import { LessonAudioPlaylist } from "@/components/lesson/lesson-audio-playlist";
import { LessonAudioDownloadActions } from "@/components/lesson/lesson-audio-download-actions";
import { LessonAudioResumeCard } from "@/components/lesson/lesson-audio-resume-card";
import { LessonSummaryActions } from "@/components/lesson/lesson-summary-actions";
import { QuizSceneClient } from "@/components/lesson/quiz-scene-client";
import { RegenerateLessonButton } from "@/components/lesson/regenerate-lesson-button";
import { RegenerateSceneButton } from "@/components/lesson/regenerate-scene-button";
import { SceneAudioPlayer } from "@/components/lesson/scene-audio-player";
import { SceneProgressTracker } from "@/components/lesson/scene-progress-tracker";
import { SourceTraceCard } from "@/components/lesson/source-trace-card";
import { TutorChatClient } from "@/components/lesson/tutor-chat-client";
import {
  getFormatAwareCopy,
} from "@/lib/server/lessons/format-aware-ui";
import {
  getSceneProgressLabel,
  resolveSceneIndex,
} from "@/lib/server/lessons/scene-navigation";
import {
  buildLessonModeHref,
  buildLessonSceneHref,
  resolveAudioFirstMode,
} from "@/lib/server/lessons/audio-first-mode";
import { buildLessonSceneNarration } from "@/lib/server/lessons/scene-audio";
import { buildLessonAudioPlaylist } from "@/lib/server/lessons/lesson-audio-playlist";
import { getGenerationModeDefinition } from "@/lib/server/lessons/generation-mode";
import { getLessonById } from "@/lib/server/lessons/lesson-service";

export const dynamic = "force-dynamic";

export default async function LessonPage({
  params,
  searchParams,
}: {
  params: Promise<{ lessonId: string }>;
  searchParams: Promise<{ scene?: string; mode?: string }>;
}) {
  const { lessonId } = await params;
  const { scene: rawScene, mode: rawMode } = await searchParams;
  const lesson = await getLessonById(lessonId);

  if (!lesson) {
    return (
      <main className="page-shell">
        <p>Lesson not found.</p>
      </main>
    );
  }

  const activeSceneIndex = resolveSceneIndex(rawScene, lesson.scenes.length);
  const activeScene = activeSceneIndex >= 0 ? lesson.scenes[activeSceneIndex] : null;
  const activeSceneStep = activeSceneIndex + 1;
  const audioMode = resolveAudioFirstMode(rawMode);
  const generationMode = getGenerationModeDefinition(lesson.generationMode);
  const formatAwareCopy = getFormatAwareCopy(lesson.lessonFormat);
  const audioPlaylist = buildLessonAudioPlaylist(lesson.scenes);
  const remainingAudioQueueLength =
    activeSceneStep > 0
      ? audioPlaylist.filter((entry) => entry.sceneOrder >= activeSceneStep).length
      : audioPlaylist.length;
  const focusCard = activeScene ? formatAwareCopy.focusCard(activeScene) : null;
  const actionBlock = activeScene ? formatAwareCopy.actionBlock?.(activeScene) : null;
  const checkpointBlock = activeScene ? formatAwareCopy.checkpointBlock?.(activeScene) : null;
  const actionBlockCompleted =
    activeScene && actionBlock
      ? lesson.interactiveBlockProgress.some(
          (entry) =>
            entry.sceneId === activeScene.id && entry.blockKind === "action" && entry.completed,
        )
      : false;
  const checkpointBlockCompleted =
    activeScene && checkpointBlock
      ? lesson.interactiveBlockProgress.some(
          (entry) =>
            entry.sceneId === activeScene.id &&
            entry.blockKind === "checkpoint" &&
            entry.completed,
        )
      : false;

  return (
    <main className={`page-shell ${audioMode ? "audio-mode-shell" : ""}`}>
      {activeSceneStep > 0 ? (
        <SceneProgressTracker lessonId={lesson.id} sceneOrder={activeSceneStep} />
      ) : null}

      <nav className="nav">
        <div>
          <strong>LessonFlow</strong>
        </div>
        <div className="nav-links">
          <Link className="nav-link" href="/">
            Home
          </Link>
          <Link className="nav-link" href="/settings">
            Settings
          </Link>
        </div>
      </nav>

      <section className="hero">
        <span className="eyebrow">{formatAwareCopy.heroEyebrow}</span>
        <h1>{lesson.title}</h1>
        <p>{lesson.prompt ?? "This lesson was generated from your uploaded material."}</p>
        <p className="status-copy">
          Generation mode: <strong>{generationMode.label}</strong> - {generationMode.description}
        </p>
        <p className="status-copy">
          Learner level: <strong>{lesson.learnerLevel}</strong> | Teaching style: <strong>{lesson.teachingStyle}</strong>
        </p>
        <p className="status-copy">
          Lesson format: <strong>{lesson.lessonFormat}</strong>
        </p>
        <div className="button-row">
          <RegenerateLessonButton lessonId={lesson.id} variant="primary" />
          {lesson.scenes.length > 0 ? (
            <Link
              className={audioMode ? "button secondary" : "button primary"}
              href={buildLessonModeHref(lesson.id, Math.max(activeSceneStep, 1), audioMode) as Route}
            >
              {audioMode ? "Exit audio mode" : "Enter audio mode"}
            </Link>
          ) : null}
        </div>
      </section>

      {!audioMode ? (
        <>
          <section className="card">
            <h2>Lesson summary</h2>
            <p className="status-copy">
              Copy or download a compact markdown summary of this lesson for notes, sharing, or review.
            </p>
            <LessonSummaryActions lessonId={lesson.id} lessonTitle={lesson.title} />
          </section>

          <section className="card">
            <h2>Lesson audio</h2>
            <p className="status-copy">
              Download generated narration as a WAV file for the current scene or the full lesson. This export currently works on Windows local installs.
            </p>
            <LessonAudioDownloadActions
              lessonId={lesson.id}
              lessonTitle={lesson.title}
              activeSceneId={activeScene?.id}
            />
          </section>

          <section className="card">
            <h2>Generated outline</h2>
            <ol className="step-list">
              {lesson.outline.map((item) => (
                <li key={item.id}>
                  <strong>{item.title}</strong>
                  {item.goal ? ` - ${item.goal}` : ""}
                  {` (${item.sceneType})`}
                </li>
              ))}
            </ol>
          </section>
        </>
      ) : (
        <section className="card audio-mode-summary-card">
          <h2>Audio-first lesson mode</h2>
          <p className="status-copy">
            This view keeps playback, scene progression, and downloads close at hand while reducing reading-first clutter.
          </p>
          <div className="button-row">
            <LessonAudioDownloadActions
              lessonId={lesson.id}
              lessonTitle={lesson.title}
              activeSceneId={activeScene?.id}
            />
          </div>
        </section>
      )}

      <section className="lesson-layout">
        <aside className="card scene-sidebar">
          <h2>{audioMode ? "Audio queue" : formatAwareCopy.pathTitle}</h2>
          <p>
            {lesson.scenes.length} scene{lesson.scenes.length === 1 ? "" : "s"} generated from{" "}
            {lesson.outline.length} outline item{lesson.outline.length === 1 ? "" : "s"}.
          </p>
          {lesson.scenes.length === 0 ? (
            <p>No scene content has been generated yet.</p>
          ) : (
            <ol className="scene-step-list">
              {lesson.scenes.map((scene, index) => (
                <li key={scene.id}>
                  <Link
                    className={`scene-step-link ${index === activeSceneIndex ? "active" : ""}`}
                    href={buildLessonSceneHref(lesson.id, index + 1, audioMode) as Route}
                  >
                    <span className="scene-step-order">{index + 1}</span>
                    <span>
                      <strong>{scene.title}</strong>
                      <small>{formatAwareCopy.sceneLabel(scene)}</small>
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </aside>

        <section className={`card scene-stage ${audioMode ? "audio-mode-stage" : ""}`}>
          <h2>{formatAwareCopy.stageTitle}</h2>
          {activeScene ? (
            <>
              <span className="eyebrow">{getSceneProgressLabel(activeSceneIndex, lesson.scenes)}</span>
              <article className="scene-article">
                <h3>{activeScene.title}</h3>
                <RegenerateSceneButton lessonId={lesson.id} sceneId={activeScene.id} />
                {audioMode ? (
                  <AudioFirstStatusCard
                    lessonId={lesson.id}
                    activeSceneOrder={activeSceneStep}
                    totalScenes={lesson.scenes.length}
                    queueLength={remainingAudioQueueLength}
                  />
                ) : null}
                <LessonAudioPlaylist
                  lessonId={lesson.id}
                  activeSceneId={activeScene?.id}
                  entries={audioPlaylist}
                  audioMode={audioMode}
                />
                <LessonAudioResumeCard lessonId={lesson.id} audioMode={audioMode} />
                {audioMode ? (
                  <div className="audio-mode-focus-card">
                    <p className="status-title">Audio-first focus</p>
                    <p className="status-copy">
                      Keep the queue, quick scene replay, and tutor handoff in one place so the lesson can stay listening-first instead of bouncing back into a reading-heavy layout.
                    </p>
                  </div>
                ) : null}
                {focusCard ? (
                  <div className={`format-focus-card ${lesson.lessonFormat}`}>
                    <p className="format-focus-title">{focusCard.title}</p>
                    <p className="status-copy">{focusCard.copy}</p>
                    <ul className="meta-list format-focus-list">
                      {focusCard.bullets.map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {actionBlock ? (
                  <InteractiveBlockCard
                    lessonId={lesson.id}
                    sceneId={activeScene.id}
                    blockKind="action"
                    lessonFormat={lesson.lessonFormat}
                    title={actionBlock.title}
                    prompt={actionBlock.prompt}
                    items={actionBlock.steps}
                    initialCompleted={actionBlockCompleted}
                    listType="ordered"
                  />
                ) : null}
                {checkpointBlock ? (
                  <InteractiveBlockCard
                    lessonId={lesson.id}
                    sceneId={activeScene.id}
                    blockKind="checkpoint"
                    lessonFormat={lesson.lessonFormat}
                    title={checkpointBlock.title}
                    prompt={checkpointBlock.prompt}
                    items={checkpointBlock.checks}
                    initialCompleted={checkpointBlockCompleted}
                    listType="unordered"
                  />
                ) : null}
                {"content" in activeScene && activeScene.content && "summary" in activeScene.content ? (
                  <>
                    <SceneAudioPlayer
                      lessonId={lesson.id}
                      sceneId={activeScene.id}
                      sceneOrder={activeSceneStep}
                      title={activeScene.title}
                      text={buildLessonSceneNarration(activeScene.title, activeScene.content)}
                      audioMode={audioMode}
                    />
                    <p>{activeScene.content.summary}</p>
                    {activeScene.content.sections.map((section) => (
                      <div key={section.heading} className="scene-section">
                        <strong>{section.heading}</strong>
                        <p>{section.body}</p>
                        {section.bullets?.length ? (
                          <ul className="meta-list">
                            {section.bullets.map((bullet) => (
                              <li key={bullet}>{bullet}</li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    ))}
                    {activeScene.content.keyTakeaways?.length ? (
                      <>
                        <strong>Key takeaways</strong>
                        <ul className="meta-list">
                          {activeScene.content.keyTakeaways.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </>
                    ) : null}
                    {activeScene.content.sourceContext ? (
                      <SourceTraceCard sourceContext={activeScene.content.sourceContext} sceneType="lesson" />
                    ) : null}
                  </>
                ) : activeScene.content && "questions" in activeScene.content ? (
                  <QuizSceneClient
                    lessonId={lesson.id}
                    sceneId={activeScene.id}
                    sceneOrder={activeSceneStep}
                    title={activeScene.title}
                    content={activeScene.content}
                    audioMode={audioMode}
                  />
                ) : (
                  <p>Scene content is not available yet.</p>
                )}
              </article>

              <div className="button-row">
                <Link
                  className="button secondary scene-nav-link"
                  aria-disabled={activeSceneIndex <= 0}
                  href={buildLessonSceneHref(
                    lesson.id,
                    Math.max(activeSceneStep - 1, 1),
                    audioMode,
                  ) as Route}
                >
                  Previous scene
                </Link>
                <Link
                  className="button primary scene-nav-link"
                  aria-disabled={activeSceneIndex >= lesson.scenes.length - 1}
                  href={buildLessonSceneHref(
                    lesson.id,
                    Math.min(activeSceneStep + 1, lesson.scenes.length),
                    audioMode,
                  ) as Route}
                >
                  Next scene
                </Link>
              </div>
            </>
          ) : (
            <p>No scene content has been generated yet.</p>
          )}
        </section>
      </section>

      <TutorChatClient
        lessonId={lesson.id}
        scenes={lesson.scenes.map((scene) => ({
          id: scene.id,
          title: scene.title,
          type: scene.type,
        }))}
        activeSceneId={activeScene?.id}
        audioMode={audioMode}
      />
    </main>
  );
}

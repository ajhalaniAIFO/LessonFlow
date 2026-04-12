"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ApiResponse } from "@/types/api";
import type { LessonJob } from "@/types/job";
import {
  generationStages,
  getJobHeadline,
  getJobSupportCopy,
  getStageState,
} from "@/lib/server/lessons/job-progress";
import { RegenerateLessonButton } from "@/components/lesson/regenerate-lesson-button";

type Props = {
  jobId: string;
};

export function GenerationStatusClient({ jobId }: Props) {
  const router = useRouter();
  const [job, setJob] = useState<LessonJob | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      const response = await fetch(`/api/jobs/${jobId}`, {
        cache: "no-store",
      });
      const payload = (await response.json()) as ApiResponse<LessonJob>;

      if (!payload.success) {
        if (!cancelled) {
          setError(payload.error.message);
        }
        return;
      }

      if (cancelled) return;
      setJob(payload.data);

      if (payload.data.status === "ready") {
        router.replace(`/lessons/${payload.data.lessonId}`);
        return;
      }

      if (payload.data.status !== "error") {
        window.setTimeout(poll, 1200);
      }
    }

    void poll();

    return () => {
      cancelled = true;
    };
  }, [jobId, router]);

  return (
    <>
      <section className="hero">
        <span className="eyebrow">Local Generation</span>
        <h1>{getJobHeadline(job)}</h1>
        <p>{error ?? getJobSupportCopy(job)}</p>
      </section>

      <section className="card-grid">
        <section className="card">
          <h2>Progress</h2>
          <div className="progress-shell" aria-hidden="true">
            <div className="progress-bar" style={{ width: `${job?.progress ?? 8}%` }} />
          </div>
          <p className="status-copy">
            <strong>{job?.progress ?? 0}%</strong> complete
          </p>

          <div className="status-box">
            <p className="status-title">Current stage</p>
            <p className="status-copy">{job?.message ?? "Loading job status..."}</p>
            {job?.errorMessage ? <p className="status-copy">{job.errorMessage}</p> : null}
          </div>

          {job?.status === "ready" ? (
            <div className="button-row">
              <Link className="button primary" href={`/lessons/${job.lessonId}`}>
                Open lesson
              </Link>
            </div>
          ) : null}

          {job?.status === "error" ? (
            <div className="button-row">
              <RegenerateLessonButton lessonId={job.lessonId} variant="primary" label="Try again" />
              <Link className="button secondary" href="/settings">
                Review model settings
              </Link>
            </div>
          ) : null}
        </section>

        <section className="card">
          <h2>Pipeline stages</h2>
          <ol className="progress-stage-list">
            {generationStages.map((stage) => {
              const state = getStageState(job, stage.key);

              return (
                <li key={stage.key} className={`progress-stage ${state}`}>
                  <div className="progress-stage-marker" aria-hidden="true" />
                  <div>
                    <strong>{stage.label}</strong>
                    <p className="status-copy">{stage.description}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      </section>
    </>
  );
}

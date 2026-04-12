"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ApiResponse } from "@/types/api";
import type { LessonJob } from "@/types/job";

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
        <span className="eyebrow">Outline Generation</span>
        <h1>We are building your lesson outline.</h1>
        <p>
          This milestone creates and stores a structured outline first. Once it is ready,
          you will be redirected automatically to the lesson page.
        </p>
      </section>

      <section className="card">
        <h2>Status</h2>
        {error ? <p>{error}</p> : null}
        {job ? (
          <>
            <p>
              <strong>Stage:</strong> {job.stage}
            </p>
            <p>
              <strong>Progress:</strong> {job.progress}%
            </p>
            <p>{job.message}</p>
            {job.errorMessage ? <p>{job.errorMessage}</p> : null}
          </>
        ) : !error ? (
          <p>Loading job status...</p>
        ) : null}
      </section>
    </>
  );
}

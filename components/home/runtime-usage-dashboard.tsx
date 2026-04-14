import Link from "next/link";
import { formatTelemetryDuration } from "@/lib/server/lessons/job-progress";
import type { RuntimeUsageDashboard } from "@/types/job";

type Props = {
  dashboard: RuntimeUsageDashboard;
};

export function RuntimeUsageDashboardCard({ dashboard }: Props) {
  return (
    <article className="card">
      <h2>Runtime usage</h2>
      {dashboard.recentJobs.length === 0 ? (
        <p className="field-hint">
          Generate a few lessons and we will start showing how your local runtime is performing.
        </p>
      ) : (
        <div className="runtime-dashboard">
          <div className="runtime-metric-grid">
            <div className="status-box">
              <p className="status-title">Average recent job</p>
              <p className="status-copy">{formatTelemetryDuration(dashboard.averageTotalMs)}</p>
            </div>
            <div className="status-box success">
              <p className="status-title">Fastest recent job</p>
              <p className="status-copy">{formatTelemetryDuration(dashboard.fastestTotalMs)}</p>
            </div>
            <div className="status-box">
              <p className="status-title">Slowest recent job</p>
              <p className="status-copy">{formatTelemetryDuration(dashboard.slowestTotalMs)}</p>
            </div>
            <div className="status-box">
              <p className="status-title">Generated content</p>
              <p className="status-copy">
                {dashboard.totalLessonScenes} lesson scenes and {dashboard.totalQuizScenes} quiz scenes
              </p>
            </div>
          </div>

          <div className="runtime-job-list">
            {dashboard.recentJobs.map((job) => (
              <div key={job.jobId} className="runtime-job-row">
                <div>
                  <strong>{job.lessonTitle}</strong>
                  <p className="status-copy">
                    {job.status} · Updated {new Date(job.updatedAt).toLocaleString()}
                  </p>
                </div>
                <div className="runtime-job-metrics">
                  <span>{formatTelemetryDuration(job.telemetry?.totalMs)}</span>
                  <small>
                    {job.telemetry?.lessonSceneCount ?? 0} lesson / {job.telemetry?.quizSceneCount ?? 0} quiz
                  </small>
                </div>
                <Link className="button secondary" href={`/lessons/${job.lessonId}`}>
                  Open
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}

import { GenerationStatusClient } from "@/components/generation/generation-status-client";

export default async function GenerationPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;

  return (
    <main className="page-shell">
      <GenerationStatusClient jobId={jobId} />
    </main>
  );
}

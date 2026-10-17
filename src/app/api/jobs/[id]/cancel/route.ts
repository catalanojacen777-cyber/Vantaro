import { handle } from '@/lib/api';
import { getJob, publicJob, requestCancel } from '@/lib/jobs';
import { authorizeJob } from '@/lib/jobs-auth';

export const POST = handle<{ params: Promise<{ id: string }> }>(async (_req, { params }) => {
  const { id } = await params;
  await authorizeJob(id);
  requestCancel(id);
  return Response.json({ job: publicJob(getJob(id)!) });
});

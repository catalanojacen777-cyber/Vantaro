import { handle } from '@/lib/api';
import { publicJob } from '@/lib/jobs';
import { authorizeJob } from '@/lib/jobs-auth';

export const GET = handle<{ params: Promise<{ id: string }> }>(async (_req, { params }) => {
  const { id } = await params;
  return Response.json({ job: publicJob(await authorizeJob(id)) });
});

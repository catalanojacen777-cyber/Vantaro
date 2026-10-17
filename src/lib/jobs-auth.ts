import 'server-only';
import { getAnonId } from '@/lib/anon';
import { getCurrentUser, workspaceAccess } from '@/lib/auth/session';
import { getJob, type JobRow } from '@/lib/jobs';
import { HttpError } from '@/lib/security/request';

/** A job is visible only to its anonymous creator or members of its workspace. */
export async function authorizeJob(id: string): Promise<JobRow> {
  const job = getJob(id);
  const notFound = new HttpError(404, 'not_found', 'That job was not found.');
  if (!job) throw notFound;
  if (job.anon_id) {
    if ((await getAnonId()) !== job.anon_id) throw notFound;
    return job;
  }
  const user = await getCurrentUser();
  if (!user) throw notFound;
  if (job.workspace_id ? !workspaceAccess(user.id, job.workspace_id) : job.user_id !== user.id) throw notFound;
  return job;
}

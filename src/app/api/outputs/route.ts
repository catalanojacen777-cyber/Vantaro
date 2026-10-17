import { z } from 'zod';
import { handle } from '@/lib/api';
import { requireWorkspace } from '@/lib/auth/session';
import { authorizeJob } from '@/lib/jobs-auth';
import { json } from '@/lib/db';
import { listOutputs, saveOutput } from '@/lib/outputs/repo';
import { COMPUTE } from '@/lib/tools/calculators';
import { TOOL_BY_SLUG } from '@/lib/tools/registry';
import { validateToolInput } from '@/lib/tools/validate';
import { HttpError, readJson } from '@/lib/security/request';
import { track } from '@/lib/analytics';

export const GET = handle(async (req) => {
  const { workspace } = await requireWorkspace();
  const url = new URL(req.url);
  return Response.json({ outputs: listOutputs(workspace.id, { q: url.searchParams.get('q') ?? undefined, tool: url.searchParams.get('tool') ?? undefined }) });
});

const body = z.union([
  z.object({ jobId: z.string().max(40), title: z.string().max(160).optional() }),
  z.object({ toolSlug: z.string().max(80), values: z.record(z.string(), z.unknown()), title: z.string().max(160).optional() }),
]);

function defaultTitle(toolName: string, subject: unknown) {
  const s = typeof subject === 'string' ? subject.replace(/\s+/g, ' ').trim() : '';
  return s ? `${toolName}: ${s.length > 60 ? `${s.slice(0, 57)}…` : s}` : toolName;
}

export const POST = handle(async (req) => {
  const { user, workspace } = await requireWorkspace('editor');
  const parsed = body.safeParse(await readJson(req));
  if (!parsed.success) throw new HttpError(400, 'invalid', 'Nothing to save.');
  const data = parsed.data;

  if ('jobId' in data) {
    // Works for runs made before signing up: the anonymous cookie proves ownership.
    const job = await authorizeJob(data.jobId);
    if (job.kind !== 'tool' || job.status !== 'succeeded' || !job.tool_slug) throw new HttpError(422, 'not_saveable', 'Only finished tool results can be saved.');
    const tool = TOOL_BY_SLUG[job.tool_slug];
    if (!tool || tool.kind !== 'ai') throw new HttpError(422, 'not_saveable', 'Unknown tool.');
    const values = json<Record<string, unknown>>(job.input, {});
    const id = saveOutput({
      workspaceId: workspace.id,
      userId: user.id,
      toolSlug: tool.slug,
      title: data.title?.trim() || defaultTitle(tool.name, values[tool.subjectField]),
      values,
      output: json(job.output, null),
      mode: job.mode,
      jobId: job.id,
    });
    track('result_saved', { tool: tool.slug, mode: job.mode });
    return Response.json({ id });
  }

  const tool = TOOL_BY_SLUG[data.toolSlug];
  if (!tool || tool.kind !== 'calculator') throw new HttpError(404, 'not_found', 'Unknown calculator.');
  const checked = validateToolInput(tool, data.values);
  if (!checked.ok) throw new HttpError(422, 'invalid_input', 'Some fields need attention.', { fields: checked.errors });
  const result = COMPUTE[tool.slug](checked.values);
  if (!result.ok) throw new HttpError(422, 'invalid_input', result.errors[0] ?? 'Check the inputs.');
  const id = saveOutput({
    workspaceId: workspace.id,
    userId: user.id,
    toolSlug: tool.slug,
    title: data.title?.trim() || `${tool.name}: ${result.headline?.value ?? ''}`.trim(),
    values: checked.values,
    output: result,
    mode: 'calculated',
    jobId: null,
  });
  track('result_saved', { tool: tool.slug, mode: 'calculated' });
  return Response.json({ id });
});

import { z } from 'zod';
import { handle } from '@/lib/api';
import { requireWorkspace } from '@/lib/auth/session';
import { startAssist } from '@/lib/jobs';
import { getPlan } from '@/lib/usage';
import { clearMessages, listMessages, MAX_QUESTION } from '@/lib/strategy/assistant';
import { HttpError, readJson } from '@/lib/security/request';
import { rateLimit } from '@/lib/security/rate-limit';

type Ctx = { params: Promise<{ id: string }> };

const body = z.object({
  question: z.string().trim().min(3, 'Ask a slightly longer question.').max(MAX_QUESTION, `Keep questions under ${MAX_QUESTION} characters.`),
  sectionKey: z.string().max(40).nullable().default(null),
  intent: z.enum(['explain', 'revise']).default('explain'),
  idempotencyKey: z.string().min(8).max(80),
});

export const GET = handle<Ctx>(async (_req, { params }) => {
  const { workspace } = await requireWorkspace('viewer');
  const { id } = await params;
  return Response.json({ messages: listMessages(workspace.id, id) });
});

export const POST = handle<Ctx>(async (req, { params }) => {
  const { id } = await params;
  const parsed = body.safeParse(await readJson(req, 8_000));
  if (!parsed.success) throw new HttpError(400, 'invalid', parsed.error.issues[0]?.message ?? 'Invalid request.');
  // Explaining is read-only; drafting a revision is editing work.
  const { user, workspace } = await requireWorkspace(parsed.data.intent === 'revise' ? 'editor' : 'viewer');
  if (!rateLimit(`assist:${user.id}`, 30, 600)) throw new HttpError(429, 'rate_limited', 'Too many questions in a short time. Wait a few minutes and try again.');
  const result = startAssist({
    actor: { type: 'user', userId: user.id, plan: getPlan(user.id) },
    workspaceId: workspace.id,
    strategyId: id,
    sectionKey: parsed.data.sectionKey,
    intent: parsed.data.intent,
    question: parsed.data.question,
    idempotencyKey: parsed.data.idempotencyKey,
  });
  return Response.json(result, { status: 202 });
});

export const DELETE = handle<Ctx>(async (_req, { params }) => {
  const { workspace } = await requireWorkspace('editor');
  const { id } = await params;
  clearMessages(workspace.id, id);
  return Response.json({ ok: true });
});

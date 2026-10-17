import { aiMode } from '@/config/site';
import { getDb, json, now } from '@/lib/db';
import { newId } from '@/lib/ids';
import { buildSystem, generateStructured, GenerationError, userInputBlock } from '@/lib/ai/provider';
import { HttpError } from '@/lib/security/request';
import { finalizeUsage, releaseUsage, reserveUsage, type Actor } from '@/lib/usage';
import { briefLines, type Brief } from '@/lib/strategy/brief';
import { SECTIONS, SECTION_BY_KEY, STRATEGY_PROMPT_VERSION } from '@/lib/strategy/sections';
import {
  createStrategyRecord,
  createVersion,
  finishStrategy,
  requireStrategy,
  saveGeneratedSection,
  setSectionStatus,
  snapshot,
  syncPersonas,
} from '@/lib/strategy/repo';
import type { AiTool } from '@/lib/tools/types';
import type { FieldValues } from '@/lib/tools/validate';
import { track } from '@/lib/analytics';
import {
  ASSIST_PROMPT_VERSION,
  ASSIST_TASK,
  REVISE_TASK,
  buildAssistPrompt,
  completeMessage,
  explainSchema,
  insertPendingMessage,
  reviseSchema,
  type AssistIntent,
} from '@/lib/strategy/assistant';

export type JobStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';
export type JobRow = {
  id: string;
  kind: 'strategy' | 'section' | 'tool' | 'import' | 'assist';
  workspace_id: string | null;
  user_id: string | null;
  anon_id: string | null;
  tool_slug: string | null;
  strategy_id: string | null;
  section_key: string | null;
  status: JobStatus;
  mode: 'live' | 'preview';
  input: string;
  output: string | null;
  progress: string | null;
  error_code: string | null;
  error_message: string | null;
  cancel_requested: number;
  usage_event_id: string | null;
  created_at: string;
  finished_at: string | null;
};

// ---------------------------------------------------------------------------
// In-process execution: a small concurrency limit and abort handles.
// ---------------------------------------------------------------------------
const g = globalThis as unknown as { __vtJobs?: { active: number; queue: (() => void)[]; aborts: Map<string, AbortController> } };
type JobState = { active: number; queue: (() => void)[]; aborts: Map<string, AbortController> };
const state: JobState = (g.__vtJobs ??= { active: 0, queue: [], aborts: new Map() });
const MAX_CONCURRENT = Number(process.env.JOB_CONCURRENCY ?? 4);

async function withSlot<T>(fn: () => Promise<T>): Promise<T> {
  if (state.active >= MAX_CONCURRENT) await new Promise<void>((r) => state.queue.push(r));
  state.active++;
  try {
    return await fn();
  } finally {
    state.active--;
    state.queue.shift()?.();
  }
}

function schedule(jobId: string, run: (signal: AbortSignal) => Promise<void>) {
  const controller = new AbortController();
  state.aborts.set(jobId, controller);
  // Detached on purpose: the HTTP response returns immediately and the client
  // polls job status, so generation survives page reloads.
  void withSlot(() => run(controller.signal))
    .catch((err) => console.error('[jobs] runner crashed', jobId, err instanceof Error ? err.message : ''))
    .finally(() => state.aborts.delete(jobId));
}

function requireMode(): 'live' | 'preview' {
  const mode = aiMode();
  if (mode === 'unavailable') {
    throw new HttpError(503, 'ai_unavailable', 'Generation is not available right now because no AI provider is connected.');
  }
  return mode;
}

export function getJob(id: string): JobRow | null {
  return (getDb().prepare('SELECT * FROM generation_jobs WHERE id=?').get(id) as JobRow | undefined) ?? null;
}

function findByIdempotency(key: string): JobRow | null {
  return (getDb().prepare('SELECT * FROM generation_jobs WHERE idempotency_key=?').get(key) as JobRow | undefined) ?? null;
}

function actorSubjectKey(actor: Actor) {
  return actor.type === 'user' ? `u:${actor.userId}` : `a:${actor.anonId}`;
}

function setProgress(id: string, progress: { step: number; total: number; label: string }) {
  getDb().prepare('UPDATE generation_jobs SET progress=? WHERE id=?').run(JSON.stringify(progress), id);
}

function markRunning(id: string) {
  getDb().prepare(`UPDATE generation_jobs SET status='running', started_at=? WHERE id=? AND status='queued'`).run(now(), id);
}

function isCancelRequested(id: string): boolean {
  const row = getDb().prepare('SELECT cancel_requested FROM generation_jobs WHERE id=?').get(id) as { cancel_requested: number } | undefined;
  return !!row?.cancel_requested;
}

function finishJob(job: { id: string; usage_event_id: string | null }, result: { status: 'succeeded'; output: unknown } | { status: 'failed' | 'cancelled'; code: string; message: string }, charge: boolean) {
  const db = getDb();
  db.transaction(() => {
    if (result.status === 'succeeded') {
      db.prepare(`UPDATE generation_jobs SET status='succeeded', output=?, finished_at=? WHERE id=?`).run(
        JSON.stringify(result.output),
        now(),
        job.id,
      );
    } else {
      db.prepare(`UPDATE generation_jobs SET status=?, error_code=?, error_message=?, finished_at=? WHERE id=?`).run(
        result.status,
        result.code,
        result.message,
        now(),
        job.id,
      );
    }
    if (job.usage_event_id) {
      if (charge) finalizeUsage(job.usage_event_id);
      else releaseUsage(job.usage_event_id);
    }
  })();
}

function errorInfo(err: unknown): { code: string; message: string } {
  if (err instanceof GenerationError) return { code: err.code, message: err.message };
  return { code: 'internal', message: 'Generation failed unexpectedly.' };
}

// ---------------------------------------------------------------------------
// Strategy generation
// ---------------------------------------------------------------------------

function strategyContext(strategyId: string, uptoKey?: string) {
  // Feed a compact digest of earlier sections so the plan stays coherent.
  const snap = snapshot(strategyId);
  const keys = ['context', 'audience', 'positioning', 'channels'];
  const digest: Record<string, unknown> = {};
  for (const sec of snap) {
    if (sec.key === uptoKey) break;
    if (!keys.includes(sec.key) || !sec.content) continue;
    const c = sec.content as Record<string, unknown>;
    if (sec.key === 'audience') {
      digest.audience = {
        segments: (c.segments as { name: string; priority: string }[] | undefined)?.map((x) => `${x.name} (${x.priority})`),
        personas: (c.personas as { name: string }[] | undefined)?.map((p) => p.name),
      };
    } else if (sec.key === 'positioning') {
      digest.positioning = { value_proposition: c.value_proposition, target: c.target, differentiator: c.differentiator };
    } else if (sec.key === 'channels') {
      digest.channels = (c.channels as { channel: string; role: string }[] | undefined)?.map((x) => `${x.channel}: ${x.role}`);
    } else {
      digest.context = { summary: c.summary };
    }
  }
  return Object.keys(digest).length ? `\n\nEarlier sections of this strategy (stay consistent with them):\n${JSON.stringify(digest)}` : '';
}

async function generateSection(strategyId: string, key: string, brief: Brief, personaCount: number, mode: 'live' | 'preview', signal: AbortSignal) {
  const def = SECTION_BY_KEY[key];
  const language = brief.language || 'English';
  const prompt = `Write the "${def.title}" section of a marketing strategy for this business.\n\n${userInputBlock(briefLines(brief))}${strategyContext(strategyId, key)}\n\nWrite in ${language}.`;
  return generateStructured(
    {
      system: buildSystem(def.task),
      prompt,
      schema: def.schema({ personaCount }),
      toolName: 'deliver_section',
      toolDescription: `Deliver the ${def.title} section`,
      maxTokens: def.maxTokens,
      signal,
      subject: brief.businessName ?? 'this business',
    },
    mode,
  );
}

export function startStrategyGeneration(opts: {
  actor: Extract<Actor, { type: 'user' }>;
  workspaceId: string;
  profileId: string | null;
  brief: Brief;
  personaCount: number;
  idempotencyKey: string;
}): { jobId: string; strategyId: string } {
  const mode = requireMode();
  const idem = `strategy:${actorSubjectKey(opts.actor)}:${opts.idempotencyKey}`;
  const existing = findByIdempotency(idem);
  if (existing) return { jobId: existing.id, strategyId: existing.strategy_id! };

  const db = getDb();
  const jobId = newId('job');
  const result = db.transaction(() => {
    const quota = reserveUsage(opts.actor, 'strategy', jobId);
    if (!quota.ok) return quota;
    const strategyId = createStrategyRecord({
      workspaceId: opts.workspaceId,
      userId: opts.actor.userId,
      profileId: opts.profileId,
      brief: opts.brief,
      mode,
      personaCount: opts.personaCount,
    });
    db.prepare(
      `INSERT INTO generation_jobs (id, kind, workspace_id, user_id, strategy_id, idempotency_key, status, mode, prompt_version, input, usage_event_id, created_at, progress)
       VALUES (?, 'strategy', ?, ?, ?, ?, 'queued', ?, ?, ?, ?, ?, ?)`,
    ).run(
      jobId,
      opts.workspaceId,
      opts.actor.userId,
      strategyId,
      idem,
      mode,
      STRATEGY_PROMPT_VERSION,
      JSON.stringify({ personaCount: opts.personaCount }),
      quota.usageEventId,
      now(),
      JSON.stringify({ step: 0, total: SECTIONS.length, label: 'Queued' }),
    );
    return { ok: true as const, strategyId };
  })();

  if (!result.ok) {
    throw new HttpError(429, 'quota_exceeded', `You have used all ${result.limit} strategy generations in the last 30 days for your plan.`, {
      limit: result.limit,
    });
  }
  track('generation_started', { kind: 'strategy', mode });
  schedule(jobId, (signal) => runStrategyJob(jobId, signal));
  return { jobId, strategyId: result.strategyId };
}

async function runStrategyJob(jobId: string, signal: AbortSignal) {
  const job = getJob(jobId);
  if (!job || !job.strategy_id || !job.workspace_id) return;
  markRunning(jobId);
  const strategy = requireStrategy(job.workspace_id, job.strategy_id);
  let succeeded = 0;
  let fatal: { code: string; message: string } | null = null;
  let cancelled = false;

  for (const [i, def] of SECTIONS.entries()) {
    if (signal.aborted || isCancelRequested(jobId)) {
      cancelled = true;
      break;
    }
    if (fatal) {
      setSectionStatus(strategy.id, def.key, 'failed', 'Skipped after an earlier provider error.');
      continue;
    }
    setProgress(jobId, { step: i + 1, total: SECTIONS.length, label: `Writing ${def.title.toLowerCase()}` });
    setSectionStatus(strategy.id, def.key, 'generating');
    try {
      const res = await generateSection(strategy.id, def.key, strategy.brief, strategy.persona_count, job.mode, signal);
      saveGeneratedSection(strategy.id, def.key, res.data, job.mode);
      if (def.key === 'audience') syncPersonas(job.workspace_id, strategy.id, res.data);
      succeeded++;
    } catch (err) {
      const info = errorInfo(err);
      if (info.code === 'cancelled') {
        cancelled = true;
        setSectionStatus(strategy.id, def.key, 'pending');
        break;
      }
      setSectionStatus(strategy.id, def.key, 'failed', info.message);
      // Credentials or provider outages will fail every section; stop early.
      if (['not_configured', 'provider_unavailable', 'rate_limited'].includes(info.code)) fatal = info;
    }
  }

  getDb()
    .prepare(`UPDATE strategy_sections SET status='failed', error='Cancelled before this section was written.' WHERE strategy_id=? AND status IN ('pending','generating')`)
    .run(strategy.id);
  const final = finishStrategy(strategy.id);
  if (succeeded > 0) createVersion(strategy.id, 'Generated', job.user_id);

  // Charge only when the person received usable work.
  const charge = succeeded > 0;
  if (cancelled) finishJob(job, { status: 'cancelled', code: 'cancelled', message: 'Generation was cancelled.' }, charge);
  else if (final === 'failed') finishJob(job, { status: 'failed', ...(fatal ?? { code: 'failed', message: 'No sections could be generated.' }) }, false);
  else finishJob(job, { status: 'succeeded', output: { strategyId: strategy.id, status: final } }, true);
  track(final === 'failed' ? 'generation_failed' : 'generation_succeeded', { kind: 'strategy', mode: job.mode });
  if (final === 'ready') track('strategy_completed', { mode: job.mode });
}

// ---------------------------------------------------------------------------
// Section regeneration
// ---------------------------------------------------------------------------

export function startSectionRegeneration(opts: {
  actor: Extract<Actor, { type: 'user' }>;
  workspaceId: string;
  strategyId: string;
  sectionKey: string;
  /** Required when the section has unsaved-to-generation user edits. */
  confirmOverwrite: boolean;
  idempotencyKey: string;
}): { jobId: string } {
  const mode = requireMode();
  const def = SECTION_BY_KEY[opts.sectionKey];
  if (!def) throw new HttpError(404, 'not_found', 'Unknown section.');
  const st = requireStrategy(opts.workspaceId, opts.strategyId);
  const idem = `section:${actorSubjectKey(opts.actor)}:${opts.idempotencyKey}`;
  const existing = findByIdempotency(idem);
  if (existing) return { jobId: existing.id };

  const sec = st.sections.find((x) => x.key === opts.sectionKey)!;
  if (sec.status === 'generating') throw new HttpError(409, 'busy', 'This section is already being generated.');
  if (st.sections.some((x) => x.status === 'generating')) throw new HttpError(409, 'busy', 'Wait for the current generation to finish.');
  if (sec.edited && !opts.confirmOverwrite) {
    throw new HttpError(409, 'has_edits', 'This section has your edits. Confirm to replace them; a version is saved first so you can restore them.');
  }

  const db = getDb();
  const jobId = newId('job');
  const result = db.transaction(() => {
    const quota = reserveUsage(opts.actor, 'generation', jobId);
    if (!quota.ok) return quota;
    if (sec.content) createVersion(st.id, `Before regenerating ${def.title.toLowerCase()}`, opts.actor.userId);
    setSectionStatus(st.id, def.key, 'generating');
    db.prepare(
      `INSERT INTO generation_jobs (id, kind, workspace_id, user_id, strategy_id, section_key, idempotency_key, status, mode, prompt_version, input, usage_event_id, created_at, progress)
       VALUES (?, 'section', ?, ?, ?, ?, ?, 'queued', ?, ?, '{}', ?, ?, ?)`,
    ).run(jobId, opts.workspaceId, opts.actor.userId, st.id, def.key, idem, mode, STRATEGY_PROMPT_VERSION, quota.usageEventId, now(), JSON.stringify({ step: 1, total: 1, label: `Writing ${def.title.toLowerCase()}` }));
    return { ok: true as const };
  })();
  if (!result.ok) {
    throw new HttpError(429, 'quota_exceeded', `You have used all ${result.limit} generations for today on your plan.`, { limit: result.limit });
  }
  schedule(jobId, (signal) => runSectionJob(jobId, signal));
  return { jobId };
}

async function runSectionJob(jobId: string, signal: AbortSignal) {
  const job = getJob(jobId);
  if (!job || !job.strategy_id || !job.workspace_id || !job.section_key) return;
  markRunning(jobId);
  const st = requireStrategy(job.workspace_id, job.strategy_id);
  const previous = st.sections.find((x) => x.key === job.section_key);
  try {
    const res = await generateSection(st.id, job.section_key, st.brief, st.persona_count, job.mode, signal);
    saveGeneratedSection(st.id, job.section_key, res.data, job.mode);
    if (job.section_key === 'audience') syncPersonas(job.workspace_id, st.id, res.data);
    finishStrategy(st.id);
    finishJob(job, { status: 'succeeded', output: { strategyId: st.id, sectionKey: job.section_key } }, true);
  } catch (err) {
    const info = errorInfo(err);
    // Put the section back the way it was: never leave the person with less than they had.
    setSectionStatus(st.id, job.section_key, previous?.content ? 'ready' : 'failed', previous?.content ? null : info.message);
    finishJob(job, { status: info.code === 'cancelled' ? 'cancelled' : 'failed', ...info }, false);
  }
}

// ---------------------------------------------------------------------------
// Tool runs
// ---------------------------------------------------------------------------

export function startToolRun(opts: {
  actor: Actor;
  workspaceId: string | null;
  tool: AiTool;
  values: FieldValues;
  idempotencyKey: string;
}): { jobId: string; remaining: number | null } {
  const mode = requireMode();
  const idem = `tool:${actorSubjectKey(opts.actor)}:${opts.idempotencyKey}`;
  const existing = findByIdempotency(idem);
  if (existing) return { jobId: existing.id, remaining: null };
  const db = getDb();
  const jobId = newId('job');
  const result = db.transaction(() => {
    const quota = reserveUsage(opts.actor, 'generation', jobId);
    if (!quota.ok) return quota;
    db.prepare(
      `INSERT INTO generation_jobs (id, kind, workspace_id, user_id, anon_id, tool_slug, idempotency_key, status, mode, prompt_version, input, usage_event_id, created_at, progress)
       VALUES (?, 'tool', ?, ?, ?, ?, ?, 'queued', ?, ?, ?, ?, ?, ?)`,
    ).run(
      jobId,
      opts.workspaceId,
      opts.actor.type === 'user' ? opts.actor.userId : null,
      opts.actor.type === 'anon' ? opts.actor.anonId : null,
      opts.tool.slug,
      idem,
      mode,
      opts.tool.promptVersion,
      JSON.stringify(opts.values),
      quota.usageEventId,
      now(),
      JSON.stringify({ step: 1, total: 1, label: `Writing ${opts.tool.outputLabel.toLowerCase()}` }),
    );
    return quota;
  })();
  if (!result.ok) {
    const signedIn = opts.actor.type === 'user';
    throw new HttpError(
      429,
      'quota_exceeded',
      signedIn
        ? `You have used all ${result.limit} generations for today on your plan.`
        : `You have used today's ${result.limit} free generations. Create a free account for a higher daily allowance and saved results.`,
      { limit: result.limit, signedIn },
    );
  }
  track('generation_started', { kind: 'tool', tool: opts.tool.slug, mode });
  schedule(jobId, (signal) => runToolJob(jobId, opts.tool, signal));
  return { jobId, remaining: result.remaining };
}

async function runToolJob(jobId: string, tool: AiTool, signal: AbortSignal) {
  const job = getJob(jobId);
  if (!job) return;
  markRunning(jobId);
  const values = json<FieldValues>(job.input, {});
  const labelled: Record<string, string> = {};
  for (const f of tool.fields) if (values[f.name] !== undefined) labelled[f.label] = String(values[f.name]);
  const language = typeof values.language === 'string' ? values.language : 'English';
  try {
    const res = await generateStructured(
      {
        system: buildSystem(tool.task),
        prompt: `${tool.name}. Use only the details below.\n\n${userInputBlock(labelled)}\n\nWrite in ${language}.`,
        schema: tool.schema,
        toolName: 'deliver_result',
        toolDescription: `Deliver the ${tool.outputLabel.toLowerCase()}`,
        maxTokens: tool.maxTokens,
        signal,
        subject: String(values[tool.subjectField] ?? '').slice(0, 60) || tool.name,
      },
      job.mode,
    );
    finishJob(job, { status: 'succeeded', output: res.data }, true);
    track('generation_succeeded', { kind: 'tool', tool: tool.slug, mode: job.mode });
  } catch (err) {
    const info = errorInfo(err);
    finishJob(job, { status: info.code === 'cancelled' ? 'cancelled' : 'failed', ...info }, false);
    track('generation_failed', { kind: 'tool', tool: tool.slug, code: info.code });
  }
}


// ---------------------------------------------------------------------------
// Contextual assistant (explain or suggest a revision; never applies changes)
// ---------------------------------------------------------------------------

export function startAssist(opts: {
  actor: Extract<Actor, { type: 'user' }>;
  workspaceId: string;
  strategyId: string;
  sectionKey: string | null;
  intent: AssistIntent;
  question: string;
  idempotencyKey: string;
}): { jobId: string; messageId: string | null } {
  const mode = requireMode();
  if (opts.sectionKey && !SECTION_BY_KEY[opts.sectionKey]) throw new HttpError(404, 'not_found', 'Unknown section.');
  if (opts.intent === 'revise' && !opts.sectionKey) throw new HttpError(400, 'section_required', 'Choose a section to revise.');
  const st = requireStrategy(opts.workspaceId, opts.strategyId);
  const idem = `assist:${actorSubjectKey(opts.actor)}:${opts.idempotencyKey}`;
  const existing = findByIdempotency(idem);
  if (existing) return { jobId: existing.id, messageId: null };

  const sec = opts.sectionKey ? st.sections.find((x) => x.key === opts.sectionKey) : null;
  if (opts.sectionKey && (!sec || sec.status !== 'ready')) {
    throw new HttpError(409, 'not_ready', 'That section is not ready yet. Generate it first, then ask about it.');
  }
  if (!st.sections.some((x) => x.status === 'ready')) throw new HttpError(409, 'not_ready', 'This strategy has no finished sections to discuss yet.');

  const db = getDb();
  const jobId = newId('job');
  const label = opts.intent === 'revise' ? `Drafting a revision of ${SECTION_BY_KEY[opts.sectionKey!].title.toLowerCase()}` : 'Reading your strategy';
  const result = db.transaction(() => {
    const quota = reserveUsage(opts.actor, 'generation', jobId);
    if (!quota.ok) return quota;
    db.prepare(
      `INSERT INTO generation_jobs (id, kind, workspace_id, user_id, strategy_id, section_key, idempotency_key, status, mode, prompt_version, input, usage_event_id, created_at, progress)
       VALUES (?, 'assist', ?, ?, ?, ?, ?, 'queued', ?, ?, ?, ?, ?, ?)`,
    ).run(
      jobId,
      opts.workspaceId,
      opts.actor.userId,
      st.id,
      opts.sectionKey,
      idem,
      mode,
      ASSIST_PROMPT_VERSION,
      JSON.stringify({ intent: opts.intent }),
      quota.usageEventId,
      now(),
      JSON.stringify({ step: 1, total: 1, label }),
    );
    const messageId = insertPendingMessage({
      workspaceId: opts.workspaceId,
      strategyId: st.id,
      userId: opts.actor.userId,
      sectionKey: opts.sectionKey,
      intent: opts.intent,
      question: opts.question,
      jobId,
      baseRevision: sec ? sec.revision : null,
    });
    return { ok: true as const, messageId };
  })();
  if (!result.ok) {
    throw new HttpError(429, 'quota_exceeded', `You have used all ${result.limit} generations for today on your plan.`, { limit: result.limit });
  }
  track('generation_started', { kind: 'assist', mode });
  schedule(jobId, (signal) => runAssistJob(jobId, opts.question, signal));
  return { jobId, messageId: result.messageId };
}

async function runAssistJob(jobId: string, question: string, signal: AbortSignal) {
  const job = getJob(jobId);
  if (!job || !job.strategy_id || !job.workspace_id) return;
  markRunning(jobId);
  const intent = json<{ intent: AssistIntent }>(job.input, { intent: 'explain' }).intent;
  try {
    const st = requireStrategy(job.workspace_id, job.strategy_id);
    const sectionKey = job.section_key;
    const schema = intent === 'revise' ? reviseSchema(sectionKey!, st.persona_count) : explainSchema;
    const def = sectionKey ? SECTION_BY_KEY[sectionKey] : null;
    const res = await generateStructured(
      {
        system: buildSystem(intent === 'revise' ? `${REVISE_TASK}\n\nHow this section is normally written:\n${def!.task}` : ASSIST_TASK),
        prompt: buildAssistPrompt({ st, workspaceId: job.workspace_id, jobId, question, sectionKey, intent }),
        schema,
        toolName: intent === 'revise' ? 'deliver_revision' : 'deliver_answer',
        toolDescription: intent === 'revise' ? `Deliver the revised ${def!.title} section` : 'Deliver the answer',
        maxTokens: intent === 'revise' ? (def!.maxTokens ?? 3000) + 600 : 1600,
        signal,
        subject: st.brief.businessName ?? 'this business',
      },
      job.mode,
    );
    completeMessage(jobId, { ok: true, answer: res.data, mode: res.mode });
    finishJob(job, { status: 'succeeded', output: { strategyId: st.id } }, true);
    track('generation_succeeded', { kind: 'assist', mode: job.mode });
  } catch (err) {
    const info = errorInfo(err);
    completeMessage(jobId, { ok: false, error: info.message });
    finishJob(job, { status: info.code === 'cancelled' ? 'cancelled' : 'failed', ...info }, false);
    track('generation_failed', { kind: 'assist', code: info.code });
  }
}

// ---------------------------------------------------------------------------

export function requestCancel(jobId: string) {
  getDb().prepare(`UPDATE generation_jobs SET cancel_requested=1 WHERE id=? AND status IN ('queued','running')`).run(jobId);
  state.aborts.get(jobId)?.abort();
}

/** Shape returned to clients: never includes another tenant's data or raw errors. */
export function publicJob(job: JobRow) {
  return {
    id: job.id,
    kind: job.kind,
    status: job.status,
    mode: job.mode,
    toolSlug: job.tool_slug,
    strategyId: job.strategy_id,
    sectionKey: job.section_key,
    progress: json(job.progress, null),
    output: job.status === 'succeeded' ? json(job.output, null) : null,
    error: job.error_code ? { code: job.error_code, message: job.error_message } : null,
    createdAt: job.created_at,
    finishedAt: job.finished_at,
  };
}

export function activeJobForStrategy(strategyId: string): string | null {
  const row = getDb()
    .prepare(`SELECT id FROM generation_jobs WHERE strategy_id=? AND kind IN ('strategy','section') AND status IN ('queued','running') ORDER BY created_at DESC LIMIT 1`)
    .get(strategyId) as { id: string } | undefined;
  return row?.id ?? null;
}

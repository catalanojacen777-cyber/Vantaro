import { beforeEach, describe, expect, it } from 'vitest';
import { freshDb, makeUser, waitFor } from './helpers';
import { getJob, startSectionRegeneration, startStrategyGeneration } from '@/lib/jobs';
import { getStrategy, listStrategies, saveEditedSection, listVersions, restoreVersion, duplicateStrategy } from '@/lib/strategy/repo';
import { strategyToMarkdown } from '@/lib/strategy/export';
import { SECTIONS } from '@/lib/strategy/sections';
import { getDb } from '@/lib/db';
import type { Brief } from '@/lib/strategy/brief';

const brief: Brief = {
  businessName: 'Brightside Window & Solar',
  productDescription: 'Residential window and solar panel cleaning for homeowners, with recurring quarterly plans.',
  customerType: 'Consumers (B2C)',
  stage: 'Early customers',
  objective: 'Generate more qualified leads',
  region: 'Northshore, Louisiana',
};

describe('strategy generation (preview mode)', () => {
  beforeEach(() => {
    delete process.env.ANTHROPIC_API_KEY;
    freshDb();
  });

  it('generates every section, persists, versions, exports and is idempotent', async () => {
    const u = makeUser();
    const actor = { type: 'user' as const, userId: u.id, plan: 'free' as const };
    const first = startStrategyGeneration({ actor, workspaceId: u.workspaceId, profileId: null, brief, personaCount: 3, idempotencyKey: 'key-123456' });
    const dup = startStrategyGeneration({ actor, workspaceId: u.workspaceId, profileId: null, brief, personaCount: 3, idempotencyKey: 'key-123456' });
    expect(dup).toEqual(first);
    const job = await waitFor(() => {
      const j = getJob(first.jobId);
      return j && j.status === 'succeeded' ? j : null;
    });
    expect(job.mode).toBe('preview');
    const st = getStrategy(u.workspaceId, first.strategyId)!;
    expect(st.status).toBe('ready');
    expect(st.sections).toHaveLength(SECTIONS.length);
    expect(st.sections.every((s) => s.status === 'ready' && s.mode === 'preview')).toBe(true);
    const audience = st.sections.find((s) => s.key === 'audience')!.content as { personas: unknown[] };
    expect(audience.personas).toHaveLength(3);
    // usage finalized exactly once
    const usage = getDb().prepare(`SELECT status FROM usage_events`).all() as { status: string }[];
    expect(usage).toEqual([{ status: 'finalized' }]);
    // personas synced
    expect((getDb().prepare('SELECT COUNT(*) n FROM personas WHERE strategy_id=?').get(st.id) as { n: number }).n).toBe(3);
    const md = strategyToMarkdown(st, { includeBrief: true });
    expect(md).toContain('# Brightside Window & Solar marketing strategy');
    expect(md).toContain('Preview output');
    expect(listStrategies(u.workspaceId)).toHaveLength(1);
    expect(listVersions(u.workspaceId, st.id).map((v) => v.label)).toEqual(['Generated']);
  });

  it('enforces the strategy quota atomically and does not charge twice', async () => {
    const u = makeUser();
    const actor = { type: 'user' as const, userId: u.id, plan: 'free' as const };
    startStrategyGeneration({ actor, workspaceId: u.workspaceId, profileId: null, brief, personaCount: 3, idempotencyKey: 'aaaaaaaa1' });
    expect(() =>
      startStrategyGeneration({ actor, workspaceId: u.workspaceId, profileId: null, brief, personaCount: 3, idempotencyKey: 'aaaaaaaa2' }),
    ).toThrow(/strategy generations/);
  });

  it('protects edits: conflict detection, overwrite confirmation, restore', async () => {
    const u = makeUser();
    const actor = { type: 'user' as const, userId: u.id, plan: 'free' as const };
    const { jobId, strategyId } = startStrategyGeneration({ actor, workspaceId: u.workspaceId, profileId: null, brief, personaCount: 3, idempotencyKey: 'edit-test-1' });
    await waitFor(() => getJob(jobId)?.status === 'succeeded');
    const st = getStrategy(u.workspaceId, strategyId)!;
    const pos = st.sections.find((s) => s.key === 'positioning')!;
    const edited = { ...(pos.content as object), value_proposition: 'Clean windows, every season, without lifting a finger.' };
    const saved = saveEditedSection(u.workspaceId, strategyId, 'positioning', edited, pos.revision);
    expect(saved.edited).toBe(true);
    // stale revision is rejected
    expect(() => saveEditedSection(u.workspaceId, strategyId, 'positioning', edited, pos.revision)).toThrow(/changed since/);
    // regeneration requires confirmation when edited
    expect(() =>
      startSectionRegeneration({ actor, workspaceId: u.workspaceId, strategyId, sectionKey: 'positioning', confirmOverwrite: false, idempotencyKey: 'regen-1-xx' }),
    ).toThrow(/your edits/);
    const regen = startSectionRegeneration({ actor, workspaceId: u.workspaceId, strategyId, sectionKey: 'positioning', confirmOverwrite: true, idempotencyKey: 'regen-2-xx' });
    await waitFor(() => getJob(regen.jobId)?.status === 'succeeded');
    const versions = listVersions(u.workspaceId, strategyId);
    const before = versions.find((v) => v.label.startsWith('Before regenerating'))!;
    expect(before).toBeTruthy();
    restoreVersion(u.workspaceId, strategyId, before.id, u.id);
    const restored = getStrategy(u.workspaceId, strategyId)!.sections.find((s) => s.key === 'positioning')!;
    expect((restored.content as { value_proposition: string }).value_proposition).toBe('Clean windows, every season, without lifting a finger.');
    const copyId = duplicateStrategy(u.workspaceId, strategyId, u.id);
    expect(getStrategy(u.workspaceId, copyId)!.sections.filter((s) => s.status === 'ready')).toHaveLength(SECTIONS.length);
  });

  it('isolates tenants: another workspace cannot read or edit', async () => {
    const a = makeUser();
    const b = makeUser();
    const actor = { type: 'user' as const, userId: a.id, plan: 'free' as const };
    const { jobId, strategyId } = startStrategyGeneration({ actor, workspaceId: a.workspaceId, profileId: null, brief, personaCount: 3, idempotencyKey: 'iso-1-xxxx' });
    await waitFor(() => getJob(jobId)?.status === 'succeeded');
    expect(getStrategy(b.workspaceId, strategyId)).toBeNull();
    expect(listStrategies(b.workspaceId)).toHaveLength(0);
    expect(() => saveEditedSection(b.workspaceId, strategyId, 'positioning', {}, 1)).toThrow(/not found/);
    expect(() => duplicateStrategy(b.workspaceId, strategyId, b.id)).toThrow(/not found/);
  });
});

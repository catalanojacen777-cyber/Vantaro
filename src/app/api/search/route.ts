import { handle } from '@/lib/api';
import { requireWorkspace } from '@/lib/auth/session';
import { listOutputs } from '@/lib/outputs/repo';
import { listStrategies } from '@/lib/strategy/repo';
import { TOOLS } from '@/lib/tools/registry';

export const GET = handle(async (req) => {
  const { workspace } = await requireWorkspace();
  const q = (new URL(req.url).searchParams.get('q') ?? '').trim().slice(0, 100);
  if (q.length < 2) return Response.json({ results: [] });
  const lower = q.toLowerCase();
  const strategies = listStrategies(workspace.id, { q }).slice(0, 6).map((s) => ({ href: `/app/strategies/${s.id}`, label: s.title, group: 'Strategies' }));
  const outputs = listOutputs(workspace.id, { q, limit: 6 }).map((o) => ({ href: `/app/outputs/${o.id}`, label: o.title, group: 'Saved outputs' }));
  const tools = TOOLS.filter((t) => t.name.toLowerCase().includes(lower) || t.summary.toLowerCase().includes(lower))
    .slice(0, 8)
    .map((t) => ({ href: `/app/tools/${t.slug}`, label: t.name, group: 'Tools', hint: t.kind === 'calculator' ? 'Calculator' : undefined }));
  return Response.json({ results: [...strategies, ...outputs, ...tools] });
});

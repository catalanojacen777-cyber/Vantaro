import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { aiMode } from '@/config/site';
import { StrategyWorkspace } from '@/components/app/strategy-workspace';
import { requireWorkspace } from '@/lib/auth/session';
import { activeJobForStrategy } from '@/lib/jobs';
import { getStrategy } from '@/lib/strategy/repo';

export const metadata: Metadata = { title: 'Strategy' };

export default async function StrategyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { workspace } = await requireWorkspace();
  const strategy = getStrategy(workspace.id, id);
  if (!strategy) notFound();
  return (
    <StrategyWorkspace
      key={strategy.id}
      initial={strategy}
      activeJobId={activeJobForStrategy(strategy.id)}
      canEdit={workspace.role !== 'viewer'}
      aiMode={aiMode()}
    />
  );
}

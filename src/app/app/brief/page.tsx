import type { Metadata } from 'next';
import { aiMode, config } from '@/config/site';
import { BriefWizard } from '@/components/app/brief-wizard';
import { PageHeader } from '@/components/app/page-header';
import { requireWorkspace } from '@/lib/auth/session';
import { getProfile } from '@/lib/strategy/profile';
import { getPlan, usageSummary } from '@/lib/usage';

export const metadata: Metadata = { title: 'Business brief' };

export default async function BriefPage() {
  const { user, workspace } = await requireWorkspace();
  const profile = getProfile(workspace.id);
  const plan = getPlan(user.id);
  const limits = plan === 'paid' ? config.limits.paid : config.limits.free;
  const strategies = usageSummary({ type: 'user', userId: user.id, plan }, 'strategy');
  return (
    <>
      <PageHeader
        crumbs={[{ href: '/app', label: 'Overview' }]}
        title="Business brief"
        description="The context every strategy and tool in this workspace builds on. Answers save automatically."
      />
      <BriefWizard
        initial={profile?.data ?? {}}
        initialStep={profile?.step ?? 0}
        languages={config.ai.outputLanguages}
        maxPersonas={limits.personasPerStrategy}
        aiMode={aiMode()}
        strategiesRemaining={strategies.remaining}
      />
    </>
  );
}

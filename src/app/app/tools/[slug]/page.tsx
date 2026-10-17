import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { aiMode } from '@/config/site';
import { PageHeader } from '@/components/app/page-header';
import { CalculatorRunner } from '@/components/tools/calculator-runner';
import { ToolRunner } from '@/components/tools/tool-runner';
import { requireWorkspace } from '@/lib/auth/session';
import { getProfile } from '@/lib/strategy/profile';
import { aiToolClient, calculatorClient } from '@/lib/tools/client-shape';
import { TOOL_BY_SLUG } from '@/lib/tools/registry';
import { getPlan, usageSummary } from '@/lib/usage';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const t = TOOL_BY_SLUG[(await params).slug];
  return { title: t?.name ?? 'Tool' };
}

export default async function AppToolPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ save?: string }> }) {
  const { slug } = await params;
  const { save } = await searchParams;
  const tool = TOOL_BY_SLUG[slug];
  if (!tool) notFound();
  const { user, workspace } = await requireWorkspace();
  const brief = getProfile(workspace.id)?.data ?? {};
  // Brief-aware: pre-fill shared context fields from the saved brief.
  const prefill: Record<string, string> = {};
  const names = new Set(tool.fields.map((f) => f.name));
  if (names.has('business') && brief.productDescription) prefill.business = [brief.businessName, brief.productDescription].filter(Boolean).join(': ').slice(0, 1200);
  if (names.has('audience') && brief.idealCustomer) prefill.audience = brief.idealCustomer.slice(0, 300);
  if (names.has('region') && brief.region) prefill.region = brief.region.slice(0, 160);
  if (names.has('stage') && brief.stage) prefill.stage = brief.stage;
  const quota = usageSummary({ type: 'user', userId: user.id, plan: getPlan(user.id) }, 'generation');
  return (
    <>
      <PageHeader
        crumbs={[{ href: '/app/tools', label: 'Tools' }]}
        title={tool.name}
        description={
          <>
            {tool.summary}{' '}
            {Object.keys(prefill).length ? <span className="subtle">Pre-filled from your <Link className="text-link" href="/app/brief">business brief</Link>.</span> : null}
          </>
        }
      />
      {tool.kind === 'ai' ? (
        <ToolRunner tool={aiToolClient(tool)} signedIn aiMode={aiMode()} quota={{ remaining: quota.remaining, limit: quota.limit }} context="app" resumeJobId={save ?? null} prefill={prefill} />
      ) : (
        <CalculatorRunner calc={calculatorClient(tool)} signedIn context="app" />
      )}
    </>
  );
}

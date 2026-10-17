import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { OutputDetail } from '@/components/app/output-detail';
import { requireWorkspace } from '@/lib/auth/session';
import { getOutput } from '@/lib/outputs/repo';
import { TOOL_BY_SLUG } from '@/lib/tools/registry';

export const metadata: Metadata = { title: 'Saved output' };

export default async function OutputPage({ params }: { params: Promise<{ id: string }> }) {
  const { workspace } = await requireWorkspace();
  const output = getOutput(workspace.id, (await params).id);
  if (!output) notFound();
  const tool = TOOL_BY_SLUG[output.tool_slug];
  const fields = tool ? tool.fields.map((f) => ({ name: f.name, label: f.label })) : [];
  return (
    <OutputDetail
      output={output}
      toolName={tool?.name ?? output.tool_slug}
      toolSlug={output.tool_slug}
      view={tool?.kind === 'ai' ? tool.view : null}
      fields={fields}
      canEdit={workspace.role !== 'viewer'}
    />
  );
}

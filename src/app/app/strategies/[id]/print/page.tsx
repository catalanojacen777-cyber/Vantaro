import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { StrategyDocument } from '@/components/app/strategy-document';
import { PrintButton } from '@/components/app/print-button';
import { requireWorkspace } from '@/lib/auth/session';
import { getStrategy } from '@/lib/strategy/repo';

export const metadata: Metadata = { title: 'Print strategy' };

export default async function PrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { workspace } = await requireWorkspace();
  const strategy = getStrategy(workspace.id, id);
  if (!strategy) notFound();
  return (
    <div className="print-page">
      <div className="print-toolbar no-print">
        <p className="small muted">Use your browser’s print dialog and choose “Save as PDF” to create a PDF.</p>
        <PrintButton />
      </div>
      <StrategyDocument strategy={strategy} showBrief />
    </div>
  );
}

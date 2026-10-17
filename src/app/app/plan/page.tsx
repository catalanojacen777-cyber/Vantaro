import type { Metadata } from 'next';
import { PageHeader } from '@/components/app/page-header';
import { PlanBoard } from '@/components/app/plan-board';
import { requireWorkspace } from '@/lib/auth/session';
import { listTasks } from '@/lib/tasks';

export const metadata: Metadata = { title: 'Action plan' };

export default async function PlanPage() {
  const { workspace } = await requireWorkspace();
  return (
    <div className="app-content-wide">
      <PageHeader title="Action plan" description="Move tasks through To do, In progress and Done. Drag cards, or use the arrows and status menu from the keyboard." />
      <PlanBoard initial={listTasks(workspace.id)} canEdit={workspace.role !== 'viewer'} />
    </div>
  );
}

import type { Metadata } from 'next';
import { config } from '@/config/site';
import { PageHeader } from '@/components/app/page-header';
import { DangerZone, PasswordForm, ProfileForm, WorkspacesForm } from '@/components/app/settings-forms';
import { listWorkspaces, requireWorkspace } from '@/lib/auth/session';
import { getPlan } from '@/lib/usage';

export const metadata: Metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const { user, workspace } = await requireWorkspace();
  const plan = getPlan(user.id);
  return (
    <>
      <PageHeader title="Settings" />
      <div className="stack" style={{ '--stack': '20px' } as React.CSSProperties}>
        <ProfileForm name={user.name} email={user.email} />
        <WorkspacesForm workspaces={listWorkspaces(user.id)} currentId={workspace.id} limit={(plan === 'paid' ? config.limits.paid : config.limits.free).workspaces} />
        <PasswordForm />
        <DangerZone />
      </div>
    </>
  );
}

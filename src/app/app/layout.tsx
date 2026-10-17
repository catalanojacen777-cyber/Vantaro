import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { aiMode } from '@/config/site';
import { AppShell } from '@/components/app/app-shell';
import { getCurrentUser, getCurrentWorkspace, listWorkspaces } from '@/lib/auth/session';
import { getPlan } from '@/lib/usage';
import { trackReturnUsage } from '@/lib/analytics';
import '@/styles/app.css';

export const metadata: Metadata = {
  title: { default: 'Workspace', template: '%s | Vantaro' },
  robots: { index: false, follow: false },
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) {
    const path = (await headers()).get('x-pathname') ?? '/app';
    redirect(`/login?next=${encodeURIComponent(path)}`);
  }
  const workspace = await getCurrentWorkspace();
  if (!workspace) redirect('/login');
  trackReturnUsage(user);
  return (
    <AppShell
      user={{ name: user.name, email: user.email }}
      workspaces={listWorkspaces(user.id)}
      current={workspace}
      plan={getPlan(user.id)}
      aiMode={aiMode()}
    >
      {children}
    </AppShell>
  );
}

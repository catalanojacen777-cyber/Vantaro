import type { Metadata } from 'next';
import { AuthForm } from '@/components/auth/auth-form';
import { pageMeta } from '@/lib/seo';

export const metadata: Metadata = pageMeta({
  title: 'Reset your password',
  description: 'Reset the password for your Vantaro account.',
  path: '/reset-password',
  noindex: true,
});

export default async function ResetPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return token ? <AuthForm mode="reset-confirm" token={token} /> : <AuthForm mode="reset-request" />;
}

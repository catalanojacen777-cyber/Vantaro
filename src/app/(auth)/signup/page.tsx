import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AuthForm } from '@/components/auth/auth-form';
import { getCurrentUser } from '@/lib/auth/session';
import { pageMeta } from '@/lib/seo';

export const metadata: Metadata = pageMeta({
  title: 'Create your account',
  description: 'Create a free Vantaro account to save tool results and build your marketing strategy.',
  path: '/signup',
  noindex: true,
});

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  if (await getCurrentUser()) redirect('/app');
  return <AuthForm mode="signup" next={next} />;
}

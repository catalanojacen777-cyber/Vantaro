import type { Metadata } from 'next';
import Link from 'next/link';
import { config, formatPrice, policiesReady } from '@/config/site';
import { Operator, PolicyShell } from '@/components/marketing/policy-shell';
import { pageMeta } from '@/lib/seo';

export const metadata: Metadata = pageMeta({ title: 'Terms of service', description: 'The terms for using Vantaro.', path: '/terms', noindex: !policiesReady() });

export default function TermsPage() {
  const price = formatPrice();
  return (
    <PolicyShell title="Terms of service" path="/terms">
      <p>These terms govern your use of Vantaro, operated by <Operator />. By creating an account or using the tools you agree to them.</p>
      <h2>The service</h2>
      <p>Vantaro generates marketing strategies, drafts and analysis using AI models, and provides calculators. Outputs can be incomplete or wrong. You are responsible for checking them before you rely on or publish them. Vantaro does not guarantee business results, rankings or revenue.</p>
      <h2>Your account and content</h2>
      <p>Keep your login details secure. You own the business information you provide and the outputs generated for you, to the extent the law allows. You give us permission to store and process that content only to provide the service.</p>
      <h2>Acceptable use</h2>
      <ul>
        <li>Do not use Vantaro to create unlawful, deceptive or harmful content, including fake reviews or misleading claims.</li>
        <li>Do not try to bypass usage limits, access other people’s data, or disrupt the service.</li>
        <li>Do not enter information you are not allowed to share, such as other people’s personal data without a lawful basis.</li>
      </ul>
      <h2>Free use and limits</h2>
      <p>Free use is subject to the limits shown on the <Link className="text-link" href="/pricing">pricing page</Link>. We may change limits to keep the service sustainable and will show current limits there.</p>
      <h2>Paid access</h2>
      <p>{price ? `${config.billing.planName} is a one-time purchase of ${price}.` : 'Paid access is not available yet.'} {config.billing.refundDays !== null ? `You can request a refund within ${config.billing.refundDays} days of purchase.` : '[Refund terms to be confirmed before paid access opens.]'} Paid access raises limits; it does not make AI usage unlimited.</p>
      <h2>Ending your account</h2>
      <p>You can delete your account at any time in Settings. We may suspend accounts that break these terms.</p>
      <h2>Liability and law</h2>
      <p>[Limitation of liability, warranty disclaimers and governing law to be completed for the operator’s jurisdiction{config.operator.jurisdiction ? ` (${config.operator.jurisdiction})` : ''} and reviewed by counsel before launch.]</p>
      <h2>Contact</h2>
      <p>Questions about these terms: <Link className="text-link" href="/contact">contact us</Link>.</p>
    </PolicyShell>
  );
}

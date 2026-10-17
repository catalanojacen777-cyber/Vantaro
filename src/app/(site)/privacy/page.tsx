import type { Metadata } from 'next';
import Link from 'next/link';
import { config, policiesReady } from '@/config/site';
import { Operator, PolicyShell } from '@/components/marketing/policy-shell';
import { pageMeta } from '@/lib/seo';

export const metadata: Metadata = pageMeta({ title: 'Privacy policy', description: 'What Vantaro collects, why, who processes it, and your choices.', path: '/privacy', noindex: !policiesReady() });

export default function PrivacyPage() {
  const contact = config.operator.privacyEmail;
  return (
    <PolicyShell title="Privacy policy" path="/privacy">
      <p>This policy explains what Vantaro collects, why, who helps us process it, and the choices you have. The service is operated by <Operator />.</p>
      <h2>What we collect</h2>
      <ul>
        <li><strong>Account details:</strong> your email address, optional name, and a salted password hash. We never store your password itself.</li>
        <li><strong>Workspace content:</strong> your business brief, generated strategies, saved tool results, personas, tasks and versions.</li>
        <li><strong>Tool inputs:</strong> what you type into tools. For anonymous use we keep the input and result so you can save it after signing up.</li>
        <li><strong>Support messages:</strong> your name, email, topic and message.</li>
        <li><strong>Security and usage records:</strong> session records, a keyed hash of your IP address (when available) for rate limiting, usage counts for daily limits, and product events such as “strategy completed”. Product events never contain your brief, prompts, results or email address.</li>
        <li><strong>Purchases:</strong> if you buy paid access, our payment provider handles your card details. We store the purchase status, amount and currency, never card numbers.</li>
      </ul>
      <h2>Cookies</h2>
      <p>We use only cookies needed to run the service: a session cookie when you log in, a workspace preference, and an anonymous identifier that lets free tool limits and result saving work without an account. We do not use advertising or third-party tracking cookies.</p>
      <h2>Who processes data for us</h2>
      <ul>
        <li><strong>AI model provider (Anthropic):</strong> your brief and tool inputs are sent to generate results{config.ai.apiKey ? '' : ' (not active in this environment)'}.</li>
        <li><strong>Payment provider (Stripe):</strong> processes purchases{config.billing.stripeSecretKey ? '' : ' (not active in this environment)'}.</li>
        <li><strong>Email provider (Resend):</strong> sends password reset and support emails{config.email.resendApiKey ? '' : ' (not active in this environment)'}.</li>
        <li><strong>Hosting provider:</strong> stores the application database. [Hosting provider and region to be confirmed before launch.]</li>
      </ul>
      <h2>How long we keep it</h2>
      <p>Workspace content stays until you delete it or delete your account. Deleting your account removes your workspaces you own and everything in them. Anonymous tool runs and rate-limit records are kept only as long as needed for limits and saving. [Backup retention period to be confirmed before launch.]</p>
      <h2>Shared links</h2>
      <p>When you create a share link, anyone with the link can view that strategy, but not your brief or workspace. Links can expire and can be revoked at any time. Shared pages are marked so search engines do not index them.</p>
      <h2>Your choices and rights</h2>
      <p>You can view, edit, export and delete your content in the app, and delete your account in Settings. To request access, correction or deletion of other data, {contact ? <>email <a className="text-link" href={`mailto:${contact}`}>{contact}</a></> : <>use the <Link className="text-link" href="/contact">contact form</Link> and choose “Privacy and data”</>}. [Applicable legal bases and regional rights to be confirmed for the operator’s jurisdiction{config.operator.jurisdiction ? ` (${config.operator.jurisdiction})` : ''}.]</p>
      <h2>Changes</h2>
      <p>We will update this page when our practices change and show the effective date at the top.</p>
    </PolicyShell>
  );
}

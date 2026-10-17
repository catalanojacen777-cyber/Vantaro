import type { Metadata } from 'next';
import { config } from '@/config/site';
import { ContactForm } from '@/components/marketing/contact-form';
import { PageHero } from '@/components/marketing/page-parts';
import { pageMeta } from '@/lib/seo';

export const metadata: Metadata = pageMeta({ title: 'Contact', description: 'Questions, feedback or account help. Send us a message.', path: '/contact' });

export default function ContactPage() {
  return (
    <>
      <PageHero crumbs={[{ name: 'Home', path: '/' }, { name: 'Contact', path: '/contact' }]} title="Get in touch" lead="Questions about the product, your account, billing or your data. Messages go straight to the team." />
      <section className="container two-col">
        <ContactForm />
        <aside className="aside">
          <div className="panel panel-pad stack" style={{ '--stack': '10px' } as React.CSSProperties}>
            <h2 style={{ fontSize: '1.05rem' }}>Other ways to reach us</h2>
            {config.operator.supportEmail ? (
              <p className="small muted">Email <a className="text-link" href={`mailto:${config.operator.supportEmail}`}>{config.operator.supportEmail}</a></p>
            ) : (
              <p className="small muted">This form is the best way to reach us.</p>
            )}
            <p className="small muted">For data requests (access, correction or deletion), choose “Privacy and data” as the topic.</p>
          </div>
        </aside>
      </section>
    </>
  );
}

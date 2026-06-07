import { MarketingNav } from '@/components/marketing/MarketingNav'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'
import { SEOHead } from '@/components/seo/SEOHead'
import { ShieldCheck, Lock, Server, EyeOff, ClipboardCheck, BellRing } from 'lucide-react'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">{title}</h2>
      <div className="text-sm text-gray-600 leading-relaxed space-y-3">{children}</div>
    </section>
  )
}

function PillarCard({ icon: Icon, title, items }: { icon: React.ElementType; title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-primary-600" />
        </div>
        <p className="font-semibold text-gray-900 text-sm">{title}</p>
      </div>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item} className="text-xs text-gray-600 flex items-start gap-2">
            <span className="text-primary-500 mt-0.5 flex-shrink-0">•</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function SecurityPage() {
  return (
    <>
      <SEOHead
        title="Security Policy"
        description="Propvian's security practices — encryption, access controls, audit logging, vulnerability disclosure, and how we protect host and guest data."
        canonical="/legal/security"
      />
      <div className="min-h-screen flex flex-col bg-white">
        <MarketingNav />
        <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-14 w-full">
          <div className="mb-10">
            <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-2">Legal</p>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-3">Security Policy</h1>
            <p className="text-sm text-gray-400">Last updated: June 2026</p>
          </div>

          <p className="text-sm text-gray-600 mb-10 leading-relaxed">Propvian takes the security of host and guest data seriously. This page describes our security practices and how we protect data across the platform. For GDPR and data privacy questions, see our <a href="/legal/privacy" className="text-primary-600 hover:underline">Privacy Policy</a> and <a href="/legal/dpa" className="text-primary-600 hover:underline">Data Processing Agreement</a>.</p>

          <Section title="Security Pillars">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 not-prose">
              <PillarCard
                icon={Lock}
                title="Encryption"
                items={[
                  'TLS 1.2+ for all data in transit',
                  'Sensitive fields encrypted at rest',
                  'Passwords stored as bcrypt hashes — never in plaintext',
                  'Payment card data handled exclusively by Stripe (PCI DSS compliant)',
                ]}
              />
              <PillarCard
                icon={ShieldCheck}
                title="Authentication &amp; Access"
                items={[
                  'JWT-based session tokens with expiry',
                  'Refresh token rotation',
                  'Role-based access control (owner, member roles)',
                  'Organization-scoped data isolation',
                  'Admin-only access to management functions',
                ]}
              />
              <PillarCard
                icon={Server}
                title="Infrastructure"
                items={[
                  'Hosted on managed cloud infrastructure',
                  'Database credentials managed via environment secrets',
                  'No secret storage in source code or version control',
                  'Automatic database backups',
                  'Health monitoring and alerting',
                ]}
              />
              <PillarCard
                icon={EyeOff}
                title="API Security"
                items={[
                  'All API endpoints require authentication (except public booking flows)',
                  'Rate limiting on authentication endpoints',
                  'Input validation and parameterized queries (SQL injection prevention)',
                  'CORS policies restrict cross-origin requests',
                  'Webhook signature verification for payment events',
                ]}
              />
              <PillarCard
                icon={ClipboardCheck}
                title="Audit Logging"
                items={[
                  'Audit logs for sensitive operations (login, billing, data exports)',
                  'Reservation and booking event history',
                  'Admin activity logging',
                  'Logs retained for 12 months',
                ]}
              />
              <PillarCard
                icon={BellRing}
                title="Incident Response"
                items={[
                  'Defined incident response process',
                  'Security incident notification within 72 hours (GDPR)',
                  'Account compromise response procedures',
                  'Vulnerability triage and patching process',
                ]}
              />
            </div>
          </Section>

          <Section title="Payment Security">
            <p>Propvian does not process or store payment card data. All payment processing for both host subscriptions and guest bookings is handled by PCI DSS-compliant payment processors:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Stripe:</strong> PCI DSS Level 1 certified. Host subscription billing and guest payment processing via Stripe Connect.</li>
              <li><strong>PayPal:</strong> PCI DSS compliant. Optional guest payment processing.</li>
            </ul>
            <p>Propvian receives only tokenized payment references and metadata (e.g., last 4 digits, card brand) — never full card numbers or CVV codes. Propvian is not, and does not act as, a payment service provider or money transmitter.</p>
          </Section>

          <Section title="Data Isolation">
            <p>All host data is isolated by organization. Hosts can only access their own properties, reservations, and guest data. Administrative staff access to host data is restricted and logged. We do not use one customer's data to train models or improve services for other customers.</p>
          </Section>

          <Section title="Responsible Disclosure">
            <p>If you believe you have found a security vulnerability in the Propvian platform, we encourage responsible disclosure. Please report vulnerabilities to:</p>
            <p><a href="mailto:security@propvian.com" className="text-primary-600 hover:underline">security@propvian.com</a></p>
            <p>Include:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>A description of the vulnerability</li>
              <li>Steps to reproduce the issue</li>
              <li>The potential impact</li>
              <li>Any supporting evidence (screenshots, logs)</li>
            </ul>
            <p>We will acknowledge receipt within 3 business days and aim to resolve valid security issues promptly. We ask that you do not publicly disclose vulnerabilities until we have had a reasonable opportunity to investigate and remediate. We do not currently operate a bug bounty program, but we appreciate responsible disclosures and will acknowledge contributors where permitted.</p>
          </Section>

          <Section title="Host Security Responsibilities">
            <p>While we work hard to secure the platform, security is a shared responsibility. As a host, you help protect your account by:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Using a strong, unique password for your Propvian account</li>
              <li>Not sharing account credentials with unauthorized parties</li>
              <li>Notifying us immediately if you suspect unauthorized access to your account</li>
              <li>Keeping your payment processor credentials (Stripe, PayPal) secure</li>
              <li>Being cautious of phishing emails — Propvian will never ask for your password by email</li>
            </ul>
          </Section>

          <Section title="Updates">
            <p>This security policy is reviewed and updated periodically. Material changes will be communicated via platform notice or email.</p>
          </Section>

          <Section title="Contact">
            <p>Security reports: <a href="mailto:security@propvian.com" className="text-primary-600 hover:underline">security@propvian.com</a></p>
            <p>General support: <a href="mailto:support@propvian.com" className="text-primary-600 hover:underline">support@propvian.com</a></p>
          </Section>
        </main>
        <MarketingFooter />
      </div>
    </>
  )
}

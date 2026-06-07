import { MarketingNav } from '@/components/marketing/MarketingNav'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'
import { SEOHead } from '@/components/seo/SEOHead'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">{title}</h2>
      <div className="text-sm text-gray-600 leading-relaxed space-y-3">{children}</div>
    </section>
  )
}

export function AcceptableUsePage() {
  return (
    <>
      <SEOHead
        title="Acceptable Use Policy"
        description="Propvian Acceptable Use Policy — prohibited activities, content standards, and enforcement for hosts using the Propvian direct booking platform."
        canonical="/legal/acceptable-use"
      />
      <div className="min-h-screen flex flex-col bg-white">
        <MarketingNav />
        <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-14 w-full">
          <div className="mb-10">
            <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-2">Legal</p>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-3">Acceptable Use Policy</h1>
            <p className="text-sm text-gray-400">Last updated: June 2026 · Version 2.0</p>
          </div>

          <Section title="1. Purpose">
            <p>This Acceptable Use Policy ("AUP") sets out the rules for lawful and appropriate use of the Propvian platform. It supplements our <a href="/legal/terms" className="text-primary-600 hover:underline">Terms of Service</a> and applies to all hosts and users of the Service. Violations of this AUP may result in suspension or termination of your account.</p>
          </Section>

          <Section title="2. Prohibited Property Listings">
            <p>You may not use Propvian to list, advertise, or rent:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Properties you do not own or are not lawfully authorized to rent</li>
              <li>Properties where short-term rentals are prohibited by law, lease, or HOA rules</li>
              <li>Properties used or intended for illegal activity</li>
              <li>Properties with fraudulent, misleading, or materially inaccurate descriptions, photos, or pricing</li>
              <li>Properties in jurisdictions where operating the Service would violate local law</li>
            </ul>
          </Section>

          <Section title="3. Prohibited Activities">
            <p>You may not use the Service to:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Fraud:</strong> Engage in any fraudulent, deceptive, or manipulative activity, including fake reviews, false availability, or misrepresenting property features</li>
              <li><strong>Financial crimes:</strong> Use the Service for money laundering, terrorism financing, tax evasion, or any other financial crime</li>
              <li><strong>Discrimination:</strong> Deny accommodation or otherwise discriminate against guests based on protected characteristics (race, gender, religion, national origin, disability, or other legally protected class)</li>
              <li><strong>Spam:</strong> Send unsolicited commercial communications to guests, leads, or any person without lawful basis</li>
              <li><strong>Harassment:</strong> Harass, threaten, or abuse guests, Propvian staff, or other users</li>
              <li><strong>Privacy violations:</strong> Collect, store, or process guest data beyond what is necessary for legitimate booking operations, or share guest data with unauthorized third parties</li>
              <li><strong>Platform abuse:</strong> Create fake accounts, artificially inflate metrics, or otherwise manipulate the platform</li>
              <li><strong>Circumvention:</strong> Attempt to bypass subscription requirements, security controls, or access controls</li>
              <li><strong>Scraping:</strong> Systematically extract data from the platform without written authorization</li>
              <li><strong>System attacks:</strong> Introduce malware, viruses, or conduct denial-of-service attacks</li>
              <li><strong>IP infringement:</strong> Upload content that infringes third-party intellectual property rights</li>
            </ul>
          </Section>

          <Section title="4. Content Standards">
            <p>All content you publish through the Service (property listings, photos, descriptions, messages) must:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Be accurate, truthful, and not materially misleading</li>
              <li>Not contain illegal content, including content that is defamatory, obscene, or violates third-party rights</li>
              <li>Not include personally identifiable information about third parties without their consent</li>
              <li>Not violate any applicable advertising, consumer protection, or fair housing laws</li>
            </ul>
          </Section>

          <Section title="5. Host Compliance Obligations">
            <p>As a condition of using the Service, you represent and warrant that:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>You hold all required licenses, permits, and registrations to operate a short-term rental in your jurisdiction</li>
              <li>You comply with all applicable tax collection and remittance requirements</li>
              <li>Your rental activity complies with applicable health, safety, and building codes</li>
              <li>You have obtained any required consent to process guest personal data and maintain a lawful privacy policy for your guests</li>
              <li>Your use of payment processors (Stripe, PayPal) complies with their respective terms of service</li>
            </ul>
          </Section>

          <Section title="6. Enforcement">
            <p>Propvian reserves the right to investigate any suspected violation of this AUP. Upon finding or reasonably suspecting a violation, we may:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Issue a warning</li>
              <li>Suspend or restrict your account temporarily</li>
              <li>Permanently terminate your account</li>
              <li>Remove any offending content</li>
              <li>Report the activity to law enforcement or regulators where required or appropriate</li>
              <li>Cooperate with payment processors to prevent fraudulent transactions</li>
            </ul>
            <p>We will generally notify you before taking enforcement action unless the violation involves fraud, abuse, or a threat to platform security that requires immediate action.</p>
          </Section>

          <Section title="7. Reporting Violations">
            <p>If you believe a user is violating this AUP, or if you become aware of any misuse of the platform, please report it to <a href="mailto:trust@propvian.com" className="text-primary-600 hover:underline">trust@propvian.com</a>. We take all reports seriously and will investigate appropriately.</p>
          </Section>

          <Section title="8. Updates">
            <p>We may update this AUP periodically. Changes will be communicated in accordance with our Terms of Service. Continued use of the Service after updates constitutes acceptance.</p>
          </Section>

          <Section title="9. Contact">
            <p>Questions about this policy: <a href="mailto:support@propvian.com" className="text-primary-600 hover:underline">support@propvian.com</a></p>
          </Section>
        </main>
        <MarketingFooter />
      </div>
    </>
  )
}

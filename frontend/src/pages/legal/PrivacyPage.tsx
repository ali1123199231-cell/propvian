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

export function PrivacyPage() {
  return (
    <>
      <SEOHead
        title="Privacy Policy | Propvian"
        description="Propvian Privacy Policy — how we collect, use, and protect your data. Covers cookies, analytics, billing, third-party integrations, and your rights under GDPR."
        canonical="/legal/privacy"
      />
      <div className="min-h-screen flex flex-col bg-white">
        <MarketingNav />
        <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-14 w-full">
          <div className="mb-10">
            <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-2">Legal</p>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-3">Privacy Policy</h1>
            <p className="text-sm text-gray-400">Last updated: May 2025</p>
          </div>

          <Section title="1. Introduction">
            <p>Propvian ("we," "us," or "our") operates the Propvian smart lock automation platform. This Privacy Policy explains how we collect, use, and protect information when you use our Service.</p>
            <p>By using the Service, you agree to the collection and use of information in accordance with this policy. We are committed to protecting your personal data and complying with applicable data protection laws, including the General Data Protection Regulation (GDPR) where applicable.</p>
          </Section>

          <Section title="2. Information We Collect">
            <p><strong>Account information:</strong> When you create an account, we collect your name, email address, and password (stored as a secure hash). If you create an organization, we collect the organization name and other details you provide.</p>
            <p><strong>Property and reservation data:</strong> We store information you provide about your properties (address, name, timezone) and reservation data synced from your connected booking platforms (guest name, check-in/out dates, reservation ID). We do not store full guest contact details beyond what is included in your calendar feed.</p>
            <p><strong>Lock access data:</strong> We store data about your TTLock connections (access tokens, lock IDs) and the access codes we generate and revoke on your behalf. This data is necessary to provide the Service.</p>
            <p><strong>Billing information:</strong> We collect billing-related information required to process payments. Card details are handled directly by Stripe or PayPal — we do not store full card numbers or CVV codes on our servers.</p>
            <p><strong>Usage data:</strong> We collect information about how you use the Service, including page views, feature usage, and error logs. This data is used to improve the Service and diagnose issues.</p>
          </Section>

          <Section title="3. How We Use Your Information">
            <ul className="list-disc pl-5 space-y-1.5">
              <li>To provide and operate the Service — syncing calendars, generating and revoking lock codes, sending notifications</li>
              <li>To process payments and manage your subscription</li>
              <li>To send you transactional communications (notifications, billing receipts, account alerts)</li>
              <li>To diagnose technical issues and improve the Service</li>
              <li>To comply with legal obligations</li>
              <li>To detect and prevent fraud or abuse</li>
            </ul>
            <p>We do not sell your personal data to third parties. We do not use your data for targeted advertising.</p>
          </Section>

          <Section title="4. Third-Party Integrations and Data Sharing">
            <p><strong>TTLock:</strong> We use your TTLock OAuth access token to create and revoke door codes through the TTLock API. This token is stored securely and used only for the purpose of managing your locks.</p>
            <p><strong>Airbnb and Booking.com:</strong> We fetch your public iCal calendar feeds to sync reservation data. These feeds may contain guest names and booking dates. We use this data only to generate the appropriate door codes for each reservation.</p>
            <p><strong>Stripe:</strong> We use Stripe to process credit and debit card payments. Stripe processes and stores card details in accordance with their Privacy Policy and PCI DSS standards.</p>
            <p><strong>PayPal:</strong> For users who pay via PayPal, payment processing is handled by PayPal in accordance with their Privacy Policy.</p>
            <p><strong>Analytics:</strong> We may use privacy-respecting analytics tools to understand how the Service is used. Analytics data is aggregated and does not personally identify you.</p>
            <p>We may disclose your information to authorities when required by law or to protect our rights.</p>
          </Section>

          <Section title="5. Cookies">
            <p>We use cookies and similar tracking technologies to operate the Service. See our Cookie Policy for details. Essential cookies are required for the Service to function. Analytics cookies are used to improve the Service — you may opt out via your cookie settings.</p>
          </Section>

          <Section title="6. Data Retention">
            <p>We retain your account data for as long as your account is active. If you close your account, we will delete or anonymize your personal data within a reasonable period, except where retention is required by law or legitimate business purposes (such as billing records for tax compliance).</p>
            <p>Access code logs and audit data are retained for 12 months after the associated reservation checkout date.</p>
          </Section>

          <Section title="7. Data Security">
            <p>We implement industry-standard security measures including encryption of data in transit (TLS) and at rest, access controls, and regular security reviews. No system is completely secure — please use a strong, unique password and notify us immediately if you suspect unauthorized access to your account.</p>
          </Section>

          <Section title="8. Your Rights">
            <p>Depending on your location and applicable law, you may have the following rights regarding your personal data:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
              <li><strong>Rectification:</strong> Request correction of inaccurate data</li>
              <li><strong>Erasure:</strong> Request deletion of your personal data ("right to be forgotten")</li>
              <li><strong>Portability:</strong> Request your data in a portable, machine-readable format</li>
              <li><strong>Objection:</strong> Object to certain processing of your data</li>
              <li><strong>Restriction:</strong> Request we limit how we process your data</li>
            </ul>
            <p>To exercise these rights, contact us through your account dashboard. We will respond within 30 days.</p>
          </Section>

          <Section title="9. GDPR — Users in the European Economic Area">
            <p>If you are located in the EEA, we process your personal data on the following legal bases: (1) contract performance — to provide the Service you've signed up for; (2) legitimate interests — to improve the Service and prevent fraud; (3) legal obligation — to comply with applicable laws; (4) consent — for optional analytics or communications where required.</p>
            <p>You have the right to lodge a complaint with your local data protection authority if you believe we have not handled your data appropriately.</p>
          </Section>

          <Section title="10. Children's Privacy">
            <p>The Service is not directed to individuals under 18. We do not knowingly collect personal data from minors. If you believe a minor has provided us with data, please contact us and we will take steps to remove it.</p>
          </Section>

          <Section title="11. Changes to This Policy">
            <p>We may update this Privacy Policy from time to time. Material changes will be communicated via email or a notice in your account. Continued use of the Service after changes constitutes acceptance of the revised policy.</p>
          </Section>

          <Section title="12. Contact">
            <p>For privacy-related questions or to exercise your rights, contact us through your account dashboard or at the contact information provided on the website.</p>
          </Section>
        </main>
        <MarketingFooter />
      </div>
    </>
  )
}

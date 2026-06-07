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
        title="Privacy Policy"
        description="Propvian Privacy Policy — how we collect, use, and protect your data. Covers GDPR, CCPA, data retention, sub-processors, and your privacy rights."
        canonical="/legal/privacy"
      />
      <div className="min-h-screen flex flex-col bg-white">
        <MarketingNav />
        <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-14 w-full">
          <div className="mb-10">
            <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-2">Legal</p>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-3">Privacy Policy</h1>
            <p className="text-sm text-gray-400">Last updated: June 2026 · Version 2.0</p>
          </div>

          <Section title="1. Who We Are">
            <p>Propvian ("we," "us," or "our") operates the Propvian direct booking platform — software that enables short-term rental hosts to create and manage their own direct-booking websites. This Privacy Policy explains how we collect, use, protect, and disclose information when you use our Service.</p>
            <p>We are committed to protecting personal data and complying with applicable data protection laws, including the General Data Protection Regulation (GDPR), UK GDPR, and the California Consumer Privacy Act (CCPA) where applicable.</p>
            <p>For GDPR purposes, Propvian is the data controller for host account data, and a data processor for guest data processed on behalf of hosts. Our <a href="/legal/dpa" className="text-primary-600 hover:underline">Data Processing Agreement</a> governs that processor relationship.</p>
          </Section>

          <Section title="2. Scope — Host Data and Guest Data">
            <p>This policy covers two distinct categories of data subjects:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Host data:</strong> Data collected from registered hosts who create accounts and use Propvian to build and operate their direct booking websites.</li>
              <li><strong>Guest data:</strong> Data collected from guests who interact with booking websites powered by Propvian. For this data, the host is the data controller and Propvian acts as a data processor on the host's behalf.</li>
            </ul>
            <p>If you are a guest who has made a booking through a property website powered by Propvian, your primary data controller is the host who operates that property. Please also review the host's own privacy policy. You may contact us at <a href="mailto:privacy@propvian.com" className="text-primary-600 hover:underline">privacy@propvian.com</a> with any questions about how we handle your data as a processor.</p>
          </Section>

          <Section title="3. Data We Collect from Hosts">
            <p><strong>Account information:</strong> Name, email address, and hashed password when you register. Organization name, billing address, and contact details when you configure your account.</p>
            <p><strong>Property data:</strong> Property names, descriptions, addresses, photos, pricing, availability, house rules, and other listing content you create within the platform.</p>
            <p><strong>Billing information:</strong> Subscription plan, billing history, and payment method metadata (last 4 digits, card brand, expiry). Full card numbers are handled exclusively by Stripe and are never stored on Propvian systems.</p>
            <p><strong>Payment provider credentials:</strong> Stripe account connection details and PayPal account identifiers, used to enable guest payments directly to you.</p>
            <p><strong>Usage data:</strong> Page views, feature interactions, session data, browser type, operating system, IP address, and referrer. Used to operate and improve the Service.</p>
            <p><strong>Communications:</strong> Support tickets, in-app messages, and email correspondence.</p>
          </Section>

          <Section title="4. Data We Collect from Guests (via Host Websites)">
            <p>When a guest makes an inquiry or booking through a host's Propvian-powered website, we collect on the host's behalf:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Booking data:</strong> Name, email address, phone number (if provided), check-in/check-out dates, number of guests, and booking messages</li>
              <li><strong>Payment data:</strong> Payment transactions are processed directly by Stripe or PayPal — Propvian does not receive or store full payment card details</li>
              <li><strong>Communication data:</strong> Messages exchanged between guests and hosts through the Propvian messaging system</li>
            </ul>
            <p>This data is processed on behalf of the host (data controller). Propvian's role is to store and display this information to the host as part of delivering the Service.</p>
          </Section>

          <Section title="5. How We Use Information and Legal Bases (GDPR)">
            <p><strong>Contract performance (Art. 6(1)(b) GDPR):</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Creating and managing your account and organization</li>
              <li>Operating your direct booking website and receiving reservations</li>
              <li>Processing your subscription and payments</li>
              <li>Sending transactional notifications (booking confirmations, billing receipts)</li>
            </ul>
            <p><strong>Legitimate interests (Art. 6(1)(f) GDPR):</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Improving the platform through anonymized usage analytics</li>
              <li>Detecting and preventing fraud, abuse, and security threats</li>
              <li>Maintaining platform integrity and enforcing our Terms</li>
            </ul>
            <p><strong>Legal obligation (Art. 6(1)(c) GDPR):</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Retaining billing records for statutory periods</li>
              <li>Responding to lawful requests from authorities</li>
            </ul>
            <p><strong>Consent (Art. 6(1)(a) GDPR):</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Optional marketing communications (you can withdraw consent at any time)</li>
              <li>Non-essential analytics cookies (managed via cookie settings)</li>
            </ul>
            <p>We do not sell personal data. We do not use personal data for targeted advertising.</p>
          </Section>

          <Section title="6. Sub-processors and Third-Party Data Sharing">
            <p>We share data only with service providers ("sub-processors") that help us deliver the Service, under written data processing agreements:</p>
            <div className="overflow-x-auto rounded-xl border border-gray-200 mt-2 mb-2">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    {['Sub-processor', 'Purpose', 'Location'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-gray-500 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="px-4 py-3 font-medium text-gray-700">Stripe</td>
                    <td className="px-4 py-3 text-gray-600">Subscription billing and guest payment processing</td>
                    <td className="px-4 py-3 text-gray-600">USA / Global</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-gray-700">PayPal</td>
                    <td className="px-4 py-3 text-gray-600">Guest payment processing (optional)</td>
                    <td className="px-4 py-3 text-gray-600">USA / Global</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-gray-700">Resend / SMTP</td>
                    <td className="px-4 py-3 text-gray-600">Transactional email delivery</td>
                    <td className="px-4 py-3 text-gray-600">USA</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-gray-700">Cloud hosting provider</td>
                    <td className="px-4 py-3 text-gray-600">Infrastructure and database hosting</td>
                    <td className="px-4 py-3 text-gray-600">EU / USA</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>We do not share personal data with advertising networks, data brokers, or unaffiliated third parties for commercial purposes.</p>
            <p>We may disclose data where required by law, in response to valid legal process, or to protect the rights and safety of Propvian, our users, or the public.</p>
          </Section>

          <Section title="7. International Data Transfers">
            <p>Propvian operates globally. Your data may be transferred to and processed in countries outside your country of residence, including the United States. We rely on appropriate transfer mechanisms for such transfers, including:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>EU Standard Contractual Clauses (SCCs)</strong> for transfers from the EEA to third countries</li>
              <li><strong>UK International Data Transfer Agreements (IDTAs)</strong> for transfers from the UK</li>
              <li>Sub-processors' own appropriate safeguards (Stripe, PayPal are subject to SCCs)</li>
            </ul>
            <p>You may request a copy of the relevant transfer mechanism documentation by contacting <a href="mailto:privacy@propvian.com" className="text-primary-600 hover:underline">privacy@propvian.com</a>.</p>
          </Section>

          <Section title="8. Cookies and Tracking Technologies">
            <p>We use cookies and similar technologies. See our <a href="/legal/cookie-policy" className="text-primary-600 hover:underline">Cookie Policy</a> for full details. In summary:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Essential cookies:</strong> Required for authentication and core platform functionality. Cannot be disabled while using the Service.</li>
              <li><strong>Analytics cookies:</strong> Help us understand how the Service is used. Optional — you can decline via the cookie banner.</li>
              <li><strong>Third-party cookies:</strong> Stripe and PayPal may set cookies when you interact with their payment elements.</li>
            </ul>
          </Section>

          <Section title="9. Data Retention">
            <p><strong>Host account data:</strong> Retained while your account is active. Upon account deletion, personal data is deleted or anonymized within 30 days, except where retention is required by law.</p>
            <p><strong>Billing records:</strong> Retained for 7 years from the transaction date for tax and legal compliance purposes.</p>
            <p><strong>Guest booking data:</strong> Retained on behalf of the host for 2 years after the checkout date, unless the host requests earlier deletion or applicable law requires different retention.</p>
            <p><strong>Usage logs:</strong> Retained for up to 12 months then deleted or anonymized.</p>
            <p><strong>Communications:</strong> Support and messaging records retained for up to 2 years.</p>
          </Section>

          <Section title="10. Data Security">
            <p>We implement industry-standard technical and organizational security measures, including:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>TLS encryption for all data in transit</li>
              <li>Encryption of sensitive data at rest</li>
              <li>Access controls and principle of least privilege</li>
              <li>Regular security reviews and testing</li>
              <li>Audit logging of sensitive operations</li>
            </ul>
            <p>No system is completely secure. In the event of a data breach affecting your rights or freedoms, we will notify you and the relevant supervisory authority as required by applicable law. For more details, see our <a href="/legal/security" className="text-primary-600 hover:underline">Security Policy</a>.</p>
          </Section>

          <Section title="11. Your Privacy Rights">
            <p>Depending on your location, you may have the following rights regarding your personal data:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
              <li><strong>Rectification:</strong> Request correction of inaccurate or incomplete data</li>
              <li><strong>Erasure:</strong> Request deletion of your personal data ("right to be forgotten"), subject to legal retention obligations</li>
              <li><strong>Portability:</strong> Receive your data in a structured, machine-readable format</li>
              <li><strong>Objection:</strong> Object to processing based on legitimate interests</li>
              <li><strong>Restriction:</strong> Request that we limit processing while a dispute is resolved</li>
              <li><strong>Withdraw consent:</strong> Where processing is based on consent, withdraw it at any time without affecting prior processing</li>
            </ul>
            <p>To exercise these rights, contact us at <a href="mailto:privacy@propvian.com" className="text-primary-600 hover:underline">privacy@propvian.com</a> or through your account dashboard. We will respond within 30 days (extendable by 60 days for complex requests with notice). See our <a href="/legal/gdpr" className="text-primary-600 hover:underline">GDPR Rights Page</a> for full details on how to exercise your rights.</p>
            <p>If you are in the EEA or UK, you have the right to lodge a complaint with your local data protection supervisory authority if you believe we have not handled your data lawfully.</p>
          </Section>

          <Section title="12. CCPA — California Residents">
            <p>If you are a California resident, you have rights under the California Consumer Privacy Act (CCPA), including:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>The right to know what personal information we collect, use, and share</li>
              <li>The right to request deletion of personal information</li>
              <li>The right to opt out of the sale of personal information (Propvian does not sell personal information)</li>
              <li>The right to non-discrimination for exercising your rights</li>
            </ul>
            <p>To exercise CCPA rights, contact us at <a href="mailto:privacy@propvian.com" className="text-primary-600 hover:underline">privacy@propvian.com</a>.</p>
          </Section>

          <Section title="13. Children's Privacy">
            <p>The Service is not directed to individuals under the age of 18. We do not knowingly collect personal data from minors. If you believe a minor has created an account or provided us with data, please contact us immediately at <a href="mailto:privacy@propvian.com" className="text-primary-600 hover:underline">privacy@propvian.com</a> and we will take steps to remove the data.</p>
          </Section>

          <Section title="14. Changes to This Policy">
            <p>We may update this Privacy Policy from time to time. We will provide notice of material changes via email and/or a prominent notice in your account at least 14 days before changes take effect. We will also update the version number and date at the top of this page.</p>
            <p>Continued use of the Service after the effective date of revised Terms constitutes your acceptance of the updated Privacy Policy.</p>
          </Section>

          <Section title="15. Contact and Data Protection Inquiries">
            <p>For privacy questions, data subject requests, or to reach our data protection contact:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Email: <a href="mailto:privacy@propvian.com" className="text-primary-600 hover:underline">privacy@propvian.com</a></li>
              <li>General support: <a href="mailto:support@propvian.com" className="text-primary-600 hover:underline">support@propvian.com</a></li>
            </ul>
            <p>We will acknowledge your request within 5 business days.</p>
          </Section>
        </main>
        <MarketingFooter />
      </div>
    </>
  )
}

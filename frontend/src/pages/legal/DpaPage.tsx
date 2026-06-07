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

export function DpaPage() {
  return (
    <>
      <SEOHead
        title="Data Processing Agreement (DPA)"
        description="Propvian Data Processing Agreement — GDPR-compliant DPA governing how Propvian processes guest data on behalf of hosts as a data processor."
        canonical="/legal/dpa"
      />
      <div className="min-h-screen flex flex-col bg-white">
        <MarketingNav />
        <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-14 w-full">
          <div className="mb-10">
            <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-2">Legal</p>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-3">Data Processing Agreement</h1>
            <p className="text-sm text-gray-400">Last updated: June 2026 · Version 2.0</p>
          </div>

          <div className="bg-blue-50 rounded-xl p-5 mb-10 text-sm text-blue-800">
            <p className="font-semibold mb-1">Who this DPA applies to</p>
            <p>This Data Processing Agreement ("DPA") applies automatically to all Propvian customers who, by accepting our Terms of Service, are processing personal data of guests through the Propvian platform. It governs the relationship between Propvian (as Data Processor) and the host (as Data Controller) for guest data only. No separate signature is required — acceptance of the Terms constitutes acceptance of this DPA.</p>
          </div>

          <Section title="1. Definitions">
            <p>In this DPA:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>"Data Controller"</strong> means the host (you) who determines the purposes and means of processing Personal Data of guests</li>
              <li><strong>"Data Processor"</strong> means Propvian, which processes Personal Data on behalf of the Data Controller</li>
              <li><strong>"Personal Data"</strong> means any information relating to an identified or identifiable natural person (guest)</li>
              <li><strong>"Processing"</strong> means any operation performed on Personal Data, including storage, retrieval, display, and transmission</li>
              <li><strong>"Data Subject"</strong> means a guest whose personal data is processed</li>
              <li><strong>"GDPR"</strong> means Regulation (EU) 2016/679 of the European Parliament and of the Council</li>
              <li><strong>"Sub-processor"</strong> means any third party engaged by Propvian to process Personal Data</li>
            </ul>
          </Section>

          <Section title="2. Subject Matter and Purpose of Processing">
            <p>Propvian processes Personal Data on behalf of the host solely to provide the Propvian platform services as described in the Terms of Service, including:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Storing and displaying guest reservation details (name, email, dates, booking messages)</li>
              <li>Enabling guest payment processing via Stripe and PayPal (payment data flows directly to those processors — Propvian does not receive payment card data)</li>
              <li>Facilitating host-guest messaging</li>
              <li>Sending booking confirmation and notification emails to guests on the host's behalf</li>
            </ul>
            <p>The duration of processing is the duration of the subscription or as required by applicable law.</p>
          </Section>

          <Section title="3. Host (Data Controller) Obligations">
            <p>As the Data Controller, you represent and warrant that:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>You have a lawful basis for collecting and processing guest personal data</li>
              <li>You have provided guests with an appropriate privacy notice explaining how their data is used, including the use of Propvian as a processor</li>
              <li>You will only instruct Propvian to process personal data in a manner consistent with applicable data protection law</li>
              <li>You are responsible for ensuring that your guests' rights can be exercised and will assist Propvian in responding to requests directed to us by your guests</li>
            </ul>
          </Section>

          <Section title="4. Propvian (Data Processor) Obligations">
            <p>As the Data Processor, Propvian agrees to:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Process Personal Data only on your documented instructions, unless otherwise required by applicable law</li>
              <li>Ensure that personnel authorized to process Personal Data are bound by appropriate confidentiality obligations</li>
              <li>Implement appropriate technical and organizational security measures as described in our <a href="/legal/security" className="text-primary-600 hover:underline">Security Policy</a></li>
              <li>Assist you in fulfilling your obligations to respond to Data Subject rights requests, to the extent technically feasible</li>
              <li>Assist you in meeting your obligations regarding security, breach notification, data protection impact assessments, and prior consultations under Articles 32–36 GDPR</li>
              <li>Delete or return Personal Data at the end of the service relationship (per our data retention policy) and delete existing copies unless storage is required by law</li>
              <li>Make available all information necessary to demonstrate compliance with this DPA and allow for audits, upon reasonable notice</li>
            </ul>
          </Section>

          <Section title="5. Sub-processors">
            <p>You provide general authorization for Propvian to engage sub-processors. Propvian's current sub-processors for guest data include:</p>
            <div className="overflow-x-auto rounded-xl border border-gray-200 mt-2 mb-2">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    {['Sub-processor', 'Purpose', 'Location', 'Safeguard'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-gray-500 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="px-4 py-3 font-medium text-gray-700">Stripe</td>
                    <td className="px-4 py-3 text-gray-600">Payment processing</td>
                    <td className="px-4 py-3 text-gray-600">USA / Global</td>
                    <td className="px-4 py-3 text-gray-600">SCCs</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-gray-700">PayPal</td>
                    <td className="px-4 py-3 text-gray-600">Payment processing</td>
                    <td className="px-4 py-3 text-gray-600">USA / Global</td>
                    <td className="px-4 py-3 text-gray-600">SCCs</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-gray-700">Resend</td>
                    <td className="px-4 py-3 text-gray-600">Email delivery</td>
                    <td className="px-4 py-3 text-gray-600">USA</td>
                    <td className="px-4 py-3 text-gray-600">SCCs / DPA</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-gray-700">Cloud host</td>
                    <td className="px-4 py-3 text-gray-600">Database &amp; infrastructure</td>
                    <td className="px-4 py-3 text-gray-600">EU / USA</td>
                    <td className="px-4 py-3 text-gray-600">SCCs / ISO 27001</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>Propvian will notify you of any intended changes to sub-processors at least 14 days in advance via email or platform notice. You may object to a new sub-processor within 14 days. If we cannot accommodate your objection, you may terminate the Services without penalty upon written notice.</p>
          </Section>

          <Section title="6. International Data Transfers">
            <p>Where Personal Data is transferred outside the EEA or UK, Propvian relies on appropriate safeguards including EU Standard Contractual Clauses (Module 3 — processor to processor) with sub-processors and EU Standard Contractual Clauses (Module 2 — controller to processor) with hosts where applicable.</p>
          </Section>

          <Section title="7. Security">
            <p>Propvian implements appropriate technical and organizational security measures to protect Personal Data against unauthorized access, disclosure, alteration, or destruction. These measures include TLS encryption in transit, encryption at rest, access controls, audit logging, and regular security reviews. Full details are in our <a href="/legal/security" className="text-primary-600 hover:underline">Security Policy</a>.</p>
          </Section>

          <Section title="8. Data Breach Notification">
            <p>In the event of a Personal Data breach affecting guest data processed on your behalf, Propvian will notify you without undue delay and in any event within 72 hours of becoming aware of the breach (to the extent feasible). The notification will include the nature of the breach, categories and approximate number of Data Subjects affected, likely consequences, and measures taken or proposed.</p>
            <p>You are responsible for notifying your guests and the relevant supervisory authority as required by applicable law.</p>
          </Section>

          <Section title="9. Data Subject Requests">
            <p>If Propvian receives a request from a guest to exercise their data subject rights (access, erasure, portability, etc.) relating to data processed on your behalf, we will forward the request to you promptly. You are the Data Controller responsible for responding to such requests. Propvian will provide reasonable technical assistance to help you respond.</p>
          </Section>

          <Section title="10. Deletion on Termination">
            <p>Upon termination of your subscription, Propvian will retain guest booking data for up to 90 days to allow data export, then delete or anonymize the data unless retention is required by law. You may request earlier deletion by contacting <a href="mailto:privacy@propvian.com" className="text-primary-600 hover:underline">privacy@propvian.com</a>.</p>
          </Section>

          <Section title="11. Governing Law">
            <p>This DPA is governed by the same governing law as the Terms of Service. To the extent GDPR or UK GDPR applies, this DPA shall be interpreted consistently with those regulations.</p>
          </Section>

          <Section title="12. Contact">
            <p>Data processing inquiries: <a href="mailto:privacy@propvian.com" className="text-primary-600 hover:underline">privacy@propvian.com</a></p>
          </Section>
        </main>
        <MarketingFooter />
      </div>
    </>
  )
}

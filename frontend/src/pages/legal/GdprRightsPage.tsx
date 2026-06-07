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

function RightCard({ title, description, how }: { title: string; description: string; how: string }) {
  return (
    <div className="rounded-xl border border-gray-200 p-5 space-y-2">
      <p className="font-semibold text-gray-900 text-sm">{title}</p>
      <p className="text-gray-600">{description}</p>
      <p className="text-gray-500 text-xs"><strong>How to exercise:</strong> {how}</p>
    </div>
  )
}

export function GdprRightsPage() {
  return (
    <>
      <SEOHead
        title="GDPR Rights & Data Requests"
        description="Exercise your GDPR data rights with Propvian — access, erasure, portability, rectification, restriction, and objection. Learn how to submit a data subject request."
        canonical="/legal/gdpr"
      />
      <div className="min-h-screen flex flex-col bg-white">
        <MarketingNav />
        <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-14 w-full">
          <div className="mb-10">
            <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-2">Legal</p>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-3">GDPR Rights &amp; Data Requests</h1>
            <p className="text-sm text-gray-400">Last updated: June 2026</p>
          </div>

          <Section title="Your Rights Under GDPR">
            <p>If you are located in the European Economic Area (EEA), United Kingdom, or another jurisdiction with equivalent data protection laws, you have the following rights regarding personal data that Propvian holds about you as a data controller. These rights are in addition to any rights you may have under other applicable laws such as the CCPA.</p>
            <p>To exercise any of the rights described on this page, submit a request to <a href="mailto:privacy@propvian.com" className="text-primary-600 hover:underline">privacy@propvian.com</a>. We will verify your identity before processing your request and will respond within 30 days (extendable by 60 additional days for complex requests, with notice).</p>
          </Section>

          <Section title="Your Rights at a Glance">
            <div className="space-y-4">
              <RightCard
                title="Right of Access (Art. 15 GDPR)"
                description="You have the right to obtain confirmation of whether we process personal data about you, and if so, to receive a copy of that data along with information about how it is used, where it comes from, and with whom it is shared."
                how="Email privacy@propvian.com with subject 'Data Access Request'. Include your account email address. We will provide a structured data export within 30 days."
              />
              <RightCard
                title="Right to Rectification (Art. 16 GDPR)"
                description="You have the right to request correction of inaccurate personal data we hold about you, and to have incomplete data completed."
                how="You can update most account data directly in your account settings. For data you cannot update yourself, email privacy@propvian.com with details of what needs to be corrected."
              />
              <RightCard
                title="Right to Erasure / 'Right to be Forgotten' (Art. 17 GDPR)"
                description="You have the right to request deletion of your personal data when: the data is no longer necessary for its original purpose; you withdraw consent and there is no other legal basis; you object to processing and there are no overriding legitimate grounds; the data was unlawfully processed; or erasure is required by law."
                how="Submit an erasure request to privacy@propvian.com. Note: we may be required to retain certain data for legal or regulatory obligations (e.g., billing records for 7 years). We will inform you of any data we are unable to delete and the reason why."
              />
              <RightCard
                title="Right to Data Portability (Art. 20 GDPR)"
                description="Where processing is based on your consent or performance of a contract, you have the right to receive your personal data in a structured, commonly used, machine-readable format (such as JSON or CSV), and to transmit it to another controller."
                how="Request a data export via privacy@propvian.com. We will provide your account data, property data, reservation data, and booking history in a portable format within 30 days."
              />
              <RightCard
                title="Right to Object (Art. 21 GDPR)"
                description="You have the right to object to processing of your personal data that is based on our legitimate interests. If you object, we will stop processing unless we can demonstrate compelling legitimate grounds that override your interests."
                how="Email privacy@propvian.com explaining the processing you object to and the grounds. For objection to direct marketing, you can unsubscribe via any marketing email or by emailing us."
              />
              <RightCard
                title="Right to Restriction of Processing (Art. 18 GDPR)"
                description="You have the right to request restriction of processing in certain circumstances: you contest the accuracy of data (while we verify); the processing is unlawful and you prefer restriction over erasure; we no longer need the data but you need it for legal claims; or you have objected to processing (while we assess your objection)."
                how="Email privacy@propvian.com specifying the restriction you are requesting and the relevant circumstances."
              />
              <RightCard
                title="Right to Withdraw Consent (Art. 7(3) GDPR)"
                description="Where processing is based on your consent (such as optional analytics cookies or marketing emails), you have the right to withdraw that consent at any time. Withdrawal does not affect the lawfulness of processing prior to withdrawal."
                how="For cookies: use the cookie settings in the platform. For marketing emails: use the unsubscribe link in any email. For other consent: email privacy@propvian.com."
              />
            </div>
          </Section>

          <Section title="Note for Guests (Visitors to Host Websites)">
            <p>If you are a guest who booked a property through a Propvian-powered website, the host of that property is the primary data controller for your booking data. Propvian acts as a data processor on the host's behalf for this data.</p>
            <p>For rights requests relating to your guest booking data, you should contact the host directly. You may also contact Propvian at <a href="mailto:privacy@propvian.com" className="text-primary-600 hover:underline">privacy@propvian.com</a> and we will assist in routing your request to the appropriate party.</p>
          </Section>

          <Section title="Identity Verification">
            <p>To protect your privacy, we verify your identity before processing data subject requests. We may ask you to confirm your registered email address, provide account information, or take other reasonable verification steps. We do this to ensure we do not disclose or delete data in response to fraudulent requests.</p>
          </Section>

          <Section title="Complaints and Supervisory Authority">
            <p>If you are dissatisfied with how we handle your data or respond to your rights request, you have the right to lodge a complaint with the relevant data protection supervisory authority in your jurisdiction:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>EU:</strong> The supervisory authority in your EU member state (list available at <span className="font-mono text-xs">edpb.europa.eu</span>)</li>
              <li><strong>UK:</strong> Information Commissioner's Office (ICO) at <span className="font-mono text-xs">ico.org.uk</span></li>
              <li><strong>Other jurisdictions:</strong> Your local data protection authority</li>
            </ul>
            <p>We would always prefer to resolve any concerns directly — please contact us first at <a href="mailto:privacy@propvian.com" className="text-primary-600 hover:underline">privacy@propvian.com</a> and we will do our best to address your concern promptly.</p>
          </Section>

          <Section title="Response Times">
            <p>We will acknowledge receipt of your request within 5 business days and provide a full response within 30 calendar days. For complex requests, we may extend this by up to 60 days, in which case we will notify you of the extension and the reason within the initial 30-day period.</p>
            <p>We provide these responses free of charge. If requests are manifestly unfounded or excessive (particularly if repetitive), we may charge a reasonable fee or refuse to respond.</p>
          </Section>

          <Section title="Contact">
            <p>Data protection inquiries: <a href="mailto:privacy@propvian.com" className="text-primary-600 hover:underline">privacy@propvian.com</a></p>
            <p>General support: <a href="mailto:support@propvian.com" className="text-primary-600 hover:underline">support@propvian.com</a></p>
          </Section>
        </main>
        <MarketingFooter />
      </div>
    </>
  )
}

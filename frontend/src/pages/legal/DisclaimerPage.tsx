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

export function DisclaimerPage() {
  return (
    <>
      <SEOHead
        title="Disclaimer"
        description="Propvian platform disclaimer — software-only service, not legal or tax advice, no property management, service availability, and limitation of warranties."
        canonical="/legal/disclaimer"
      />
      <div className="min-h-screen flex flex-col bg-white">
        <MarketingNav />
        <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-14 w-full">
          <div className="mb-10">
            <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-2">Legal</p>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-3">Disclaimer</h1>
            <p className="text-sm text-gray-400">Last updated: June 2026</p>
          </div>

          <Section title="Software Only — Not Professional Advice">
            <p>Propvian is a software platform. Nothing on the Propvian website, within the Propvian application, or in any communications from Propvian constitutes legal, tax, financial, accounting, insurance, or any other form of professional advice.</p>
            <p>Before operating a short-term rental business, you should consult qualified legal, tax, and regulatory professionals familiar with the laws applicable in your jurisdiction. Rental regulations, licensing requirements, tax obligations, and permissibility vary significantly by location and change frequently.</p>
            <p>Propvian does not represent that the platform will ensure your rental operations are compliant with any applicable law.</p>
          </Section>

          <Section title="Not a Travel Agency, Property Manager, or Booking Agent">
            <p>Propvian is not a travel agency, booking agency, property management company, or real estate agent. Propvian does not own, manage, list, inspect, or endorse any property offered on websites built using the platform.</p>
            <p>All properties listed on Propvian-powered websites are listed by and the responsibility of the individual host. Propvian has no knowledge of, and makes no representation about, the condition, safety, legality, suitability, or accuracy of any listed property.</p>
          </Section>

          <Section title="Not the Merchant of Record">
            <p>Propvian is not the merchant of record for any booking transaction. Payments are processed directly between guests and hosts via Stripe and/or PayPal. Propvian does not receive, hold, or transmit guest funds at any point. Propvian has no responsibility for payment disputes, chargebacks, or refunds related to property bookings.</p>
          </Section>

          <Section title="No Guarantee of Availability">
            <p>The Propvian platform is provided on an "as-available" basis. We do not guarantee continuous, uninterrupted, or error-free access to the Service. The platform may experience downtime due to maintenance, technical issues, third-party service failures, or events beyond our control. Propvian is not responsible for any losses or damages resulting from service unavailability.</p>
          </Section>

          <Section title="Third-Party Services and Links">
            <p>The Propvian platform integrates with third-party services (including Stripe, PayPal, and email providers) and may contain links to third-party websites. Propvian does not control and is not responsible for the content, privacy practices, or reliability of any third-party service or website. Links do not constitute endorsement.</p>
          </Section>

          <Section title="No Warranty on Guest-Host Relationships">
            <p>Propvian makes no representation or warranty about the conduct, identity, or reliability of any host or guest who uses the platform. Propvian does not screen, verify, or vet hosts or guests beyond our standard platform verification processes. Any interaction, agreement, or dispute between a host and guest is solely between those parties.</p>
          </Section>

          <Section title="Accuracy of Information">
            <p>While we strive to keep platform documentation, help content, and marketing materials accurate, we make no warranty that any information on the Propvian website or in the application is complete, accurate, or current. Features, pricing, and policies may change.</p>
          </Section>

          <Section title="Limitation of Liability">
            <p>To the maximum extent permitted by law, Propvian's liability for any claim arising out of or related to your use of the platform is limited as described in our <a href="/legal/terms" className="text-primary-600 hover:underline">Terms of Service</a>. This includes but is not limited to claims related to service availability, data loss, compliance failures, or guest-host disputes.</p>
          </Section>

          <Section title="Jurisdiction-Specific Variations">
            <p>Some jurisdictions do not allow certain disclaimers or limitations of liability. In such jurisdictions, our liability is limited to the maximum extent permitted by applicable law. This disclaimer does not affect any statutory rights that cannot be waived under applicable law.</p>
          </Section>

          <Section title="Contact">
            <p>For questions about this disclaimer: <a href="mailto:support@propvian.com" className="text-primary-600 hover:underline">support@propvian.com</a></p>
          </Section>
        </main>
        <MarketingFooter />
      </div>
    </>
  )
}

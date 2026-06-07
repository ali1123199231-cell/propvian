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

export function RefundPage() {
  return (
    <>
      <SEOHead
        title="Refund Policy"
        description="Propvian Refund Policy — subscription billing, cancellation terms, and refund eligibility for the Propvian direct booking platform."
        canonical="/legal/refund-policy"
      />
      <div className="min-h-screen flex flex-col bg-white">
        <MarketingNav />
        <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-14 w-full">
          <div className="mb-10">
            <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-2">Legal</p>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-3">Refund Policy</h1>
            <p className="text-sm text-gray-400">Last updated: June 2026 · Version 2.0</p>
          </div>

          <Section title="1. Important Scope Clarification">
            <p>This Refund Policy applies exclusively to <strong>Propvian subscription fees</strong> paid by hosts to use the Propvian platform. It does not govern refunds for guest bookings made through Propvian-powered property websites.</p>
            <p>Refunds for guest bookings are solely at the discretion of the individual host. Each host sets their own cancellation and refund policy for their guests. If you are a guest seeking a refund for a property booking, please contact the host directly or review the cancellation policy displayed at the time of your booking.</p>
          </Section>

          <Section title="2. Free Trial Period">
            <p>Propvian offers a free trial to all new accounts. No payment information is required during the trial. There is nothing to refund during the trial period — you simply stop using the Service if you choose not to subscribe.</p>
          </Section>

          <Section title="3. Subscription Billing">
            <p>Propvian subscriptions are billed monthly (or annually, if selected) in advance on a recurring basis. Payment is charged on the same date of each billing period as your initial subscription date. Subscription charges cover the upcoming billing period. Access to subscription features is granted immediately upon successful payment.</p>
            <p><strong>Recurring billing notice:</strong> Your subscription will automatically renew until cancelled. You may cancel at any time from your billing settings before the next renewal date to avoid being charged for the next period.</p>
          </Section>

          <Section title="4. Cancellation">
            <p>You may cancel your subscription at any time from your billing settings in the account dashboard. Cancellation takes effect at the end of your current billing period. You retain full access to subscription features until the period you have paid for ends.</p>
            <p>We do not provide prorated refunds for partial billing periods upon voluntary cancellation. Your subscription will not renew after cancellation is confirmed.</p>
          </Section>

          <Section title="5. Refund Eligibility for Subscription Fees">
            <p>Propvian subscription fees are generally non-refundable, as the Service provides immediate access to platform functionality from the start of each billing period. However, we will consider refund requests in the following exceptional circumstances:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Significant documented service unavailability:</strong> If Propvian experienced verified, continuous downtime of 48 hours or more during a billing period caused by our infrastructure (not by third-party services beyond our control), we may offer a prorated credit or partial refund for that period.</li>
              <li><strong>Billing errors:</strong> If you were charged an incorrect amount due to a system or billing error on our part, we will correct the charge and refund any overpayment promptly.</li>
              <li><strong>Duplicate charges:</strong> If you were charged more than once for the same billing period, we will refund the duplicate charge.</li>
              <li><strong>Unauthorized charges:</strong> If a charge was processed without your authorization (and you notify us promptly), we will investigate and issue a refund if the claim is substantiated.</li>
            </ul>
            <p>Refund requests must be submitted within 30 days of the charge in question. Requests submitted after this window may not be honored except where required by applicable consumer protection laws.</p>
          </Section>

          <Section title="6. How to Request a Refund">
            <p>To request a refund, contact us at <a href="mailto:support@propvian.com" className="text-primary-600 hover:underline">support@propvian.com</a> with the following information:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Your account email address</li>
              <li>The date and amount of the charge</li>
              <li>A clear description of the reason for your refund request</li>
            </ul>
            <p>We will review your request and respond within 5 business days. Approved refunds are returned to your original payment method. Processing times depend on your bank or payment provider — typically 5–10 business days for card refunds.</p>
          </Section>

          <Section title="7. Chargebacks">
            <p>If you initiate a chargeback or payment dispute with your bank or card issuer before contacting us, we reserve the right to suspend your account pending resolution and to contest the chargeback with evidence of valid service delivery. We encourage you to contact us first — most billing issues can be resolved quickly and directly without a formal dispute.</p>
          </Section>

          <Section title="8. EU and UK Consumer Rights">
            <p>If you are a consumer located in the European Union or United Kingdom, you may have additional statutory rights under applicable consumer protection laws, including cooling-off rights for certain digital services. Where applicable, these statutory rights are not limited or excluded by this policy.</p>
            <p>However, please note that by using the Service, you may expressly consent to immediate service provision, which may affect your right of withdrawal under EU/UK consumer law. We will provide clear disclosure of this at the point of subscription.</p>
          </Section>

          <Section title="9. Changes to This Policy">
            <p>We may update this Refund Policy from time to time. Changes will be communicated with reasonable notice via email or account notification. Continued use of the Service after the effective date of changes constitutes acceptance.</p>
          </Section>

          <Section title="10. Contact">
            <p>For refund requests or billing questions, contact us at <a href="mailto:support@propvian.com" className="text-primary-600 hover:underline">support@propvian.com</a> or through your account dashboard.</p>
          </Section>
        </main>
        <MarketingFooter />
      </div>
    </>
  )
}

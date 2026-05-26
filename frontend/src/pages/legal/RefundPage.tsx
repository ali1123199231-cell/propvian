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
        title="Refund Policy | Propvian"
        description="Propvian Refund Policy — subscription billing, cancellation handling, and refund eligibility for the Propvian smart lock automation platform."
        canonical="/legal/refund-policy"
      />
      <div className="min-h-screen flex flex-col bg-white">
        <MarketingNav />
        <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-14 w-full">
          <div className="mb-10">
            <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-2">Legal</p>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-3">Refund Policy</h1>
            <p className="text-sm text-gray-400">Last updated: May 2025</p>
          </div>

          <Section title="1. Free Trial Period">
            <p>Propvian offers a 30-day free trial to all new accounts. No payment information is required during the trial. There is nothing to refund during the trial period — you simply stop using the Service if you decide not to subscribe.</p>
          </Section>

          <Section title="2. Subscription Billing">
            <p>Propvian subscriptions are billed monthly in advance. Payment is charged on the same day of each month as your initial subscription date. For example, if you subscribe on the 10th of a month, you will be billed on the 10th of each subsequent month.</p>
            <p>Subscription charges cover the upcoming billing period. Access to the Service is granted immediately upon successful payment.</p>
          </Section>

          <Section title="3. Cancellation">
            <p>You may cancel your subscription at any time from the billing settings in your account. Cancellation takes effect at the end of your current billing period. You will continue to have full access to the Service until the end of the period you have paid for.</p>
            <p>We do not prorate refunds when you cancel mid-period. Your subscription will not automatically renew after cancellation.</p>
          </Section>

          <Section title="4. Refund Eligibility">
            <p>We generally do not offer refunds for subscription payments, as the Service provides immediate value from the start of each billing period. However, we will consider refund requests in the following exceptional circumstances:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Service unavailability:</strong> If Propvian experienced significant, documented downtime (more than 48 consecutive hours) during a billing period due to our infrastructure failures, we may offer a prorated credit or partial refund for the affected period.</li>
              <li><strong>Billing errors:</strong> If you were charged an incorrect amount due to a billing error on our part, we will correct the error and issue a refund for the overcharged amount.</li>
              <li><strong>Duplicate charges:</strong> If you were charged more than once for the same billing period, we will refund the duplicate charge.</li>
            </ul>
            <p>Refund requests must be submitted within 30 days of the charge in question. Requests submitted after this period may not be honored.</p>
          </Section>

          <Section title="5. How to Request a Refund">
            <p>To request a refund, contact us through your account dashboard with the following information:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Your account email address</li>
              <li>The date and amount of the charge</li>
              <li>The reason for your refund request</li>
            </ul>
            <p>We will review your request and respond within 5 business days. Approved refunds are processed back to your original payment method and typically appear within 5–10 business days depending on your bank or payment provider.</p>
          </Section>

          <Section title="6. Chargebacks">
            <p>If you initiate a chargeback with your bank or card issuer without first contacting us to resolve the issue, we reserve the right to suspend your account pending resolution. We encourage you to contact us first — most billing concerns can be resolved quickly without a chargeback.</p>
          </Section>

          <Section title="7. Changes to This Policy">
            <p>We may update this Refund Policy from time to time. Changes will be communicated with reasonable notice. Continued use of the Service after changes constitutes acceptance of the revised policy.</p>
          </Section>

          <Section title="8. Contact">
            <p>For refund requests or billing questions, contact us through your account dashboard or at the contact information on the website.</p>
          </Section>
        </main>
        <MarketingFooter />
      </div>
    </>
  )
}

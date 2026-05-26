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

export function TermsPage() {
  return (
    <>
      <SEOHead
        title="Terms of Service | Propvian"
        description="Propvian Terms of Service — subscription terms, billing, trial period, cancellation policy, and acceptable use for the Propvian smart lock automation platform."
        canonical="/legal/terms"
        noIndex={false}
      />
      <div className="min-h-screen flex flex-col bg-white">
        <MarketingNav />
        <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-14 w-full">
          <div className="mb-10">
            <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-2">Legal</p>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-3">Terms of Service</h1>
            <p className="text-sm text-gray-400">Last updated: May 2025</p>
          </div>

          <Section title="1. Acceptance of Terms">
            <p>By creating an account or using Propvian (the "Service"), you agree to be bound by these Terms of Service ("Terms"). If you are using the Service on behalf of an organization, you represent that you have authority to bind that organization to these Terms.</p>
            <p>We may update these Terms from time to time. Continued use of the Service after changes are posted constitutes acceptance of the revised Terms.</p>
          </Section>

          <Section title="2. Description of Service">
            <p>Propvian is a software-as-a-service (SaaS) platform that enables short-term rental hosts and property managers to automate smart lock access code management. The Service integrates with third-party platforms including TTLock, Airbnb, and Booking.com to automatically generate and revoke guest access codes based on reservation data.</p>
            <p>The Service is provided on an "as-is" and "as-available" basis. Features and integrations may change over time with reasonable notice.</p>
          </Section>

          <Section title="3. Accounts and Organizations">
            <p>You must provide accurate and complete information when creating your account. You are responsible for maintaining the confidentiality of your login credentials and for all activity under your account.</p>
            <p>Each account is associated with one organization. Multiple users may be added to an organization. The account owner is responsible for all usage within the organization.</p>
          </Section>

          <Section title="4. Free Trial">
            <p>New accounts receive a 30-day free trial. The trial provides full access to all Service features at no charge. No payment information is required to start a trial.</p>
            <p>After the trial period, continued use of the Service requires a paid subscription. If you do not subscribe, your account remains accessible but automation functionality is paused. Your data is retained.</p>
            <p>Propvian reserves the right to modify trial terms with notice.</p>
          </Section>

          <Section title="5. Subscription and Billing">
            <p>Propvian is offered on a recurring subscription basis. Current pricing is $2.00 USD per connected smart lock per month. Pricing may change with 30 days' written notice to existing subscribers.</p>
            <p>Subscriptions are billed monthly in advance. Payment is processed through Stripe or PayPal. By providing payment information, you authorize us to charge your payment method for the subscription amount on the applicable billing date.</p>
            <p>If a payment fails, we will attempt to reprocess the payment. Access to automation features may be suspended if payment remains outstanding after reasonable attempts. You will be notified of payment failures.</p>
            <p>All fees are exclusive of applicable taxes. You are responsible for any taxes applicable to your use of the Service.</p>
          </Section>

          <Section title="6. Cancellation Policy">
            <p>You may cancel your subscription at any time through the billing settings in your account. Cancellation takes effect at the end of your current billing period — you retain access to the Service until that date.</p>
            <p>We do not prorate refunds for partial billing periods upon cancellation. See our Refund Policy for details on exceptional circumstances.</p>
          </Section>

          <Section title="7. Automation Disclaimers">
            <p>Propvian automates smart lock code management based on reservation data provided by third-party calendar integrations. The accuracy of automation depends on the accuracy and timeliness of that reservation data.</p>
            <p>You acknowledge that:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Propvian does not contact your guests directly. You are responsible for communicating access codes to guests.</li>
              <li>Propvian does not guarantee uninterrupted delivery of automation services. Temporary outages of the TTLock API, Airbnb iCal, or Booking.com iCal may affect code generation timing.</li>
              <li>You remain responsible for verifying that guests have working access to your property. Propvian is a productivity tool, not a substitute for host oversight.</li>
              <li>Physical access to your property is ultimately governed by your smart lock hardware, not by Propvian software. Hardware failures, battery outages, or network issues may affect lock function independently of Propvian.</li>
            </ul>
          </Section>

          <Section title="8. Third-Party Integrations">
            <p>The Service integrates with TTLock, Airbnb, Booking.com, Stripe, and PayPal. These integrations are provided as-is and are subject to the terms and availability of those third-party services. Propvian is not affiliated with or endorsed by Airbnb, Booking.com, or TTLock.</p>
            <p>Changes by third-party platforms to their APIs or data formats may affect Service functionality. We will make reasonable efforts to maintain integrations, but cannot guarantee uninterrupted compatibility.</p>
          </Section>

          <Section title="9. Acceptable Use">
            <p>You agree not to use the Service to:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Generate access codes for properties you do not own or manage with permission</li>
              <li>Access or attempt to access other users' accounts or data</li>
              <li>Reverse engineer, decompile, or otherwise attempt to extract source code</li>
              <li>Use the Service for any illegal purpose or in violation of applicable law</li>
              <li>Circumvent any security or access control mechanisms</li>
              <li>Resell or sublicense the Service without written permission</li>
            </ul>
          </Section>

          <Section title="10. Intellectual Property">
            <p>Propvian and its licensors retain all intellectual property rights in the Service, including software, content, trademarks, and documentation. These Terms do not grant you any ownership rights in the Service.</p>
            <p>You retain ownership of your data (property information, reservation data, organization details) uploaded to the Service. By using the Service, you grant us a limited license to process your data to provide the Service.</p>
          </Section>

          <Section title="11. Data and Privacy">
            <p>Your use of the Service is governed by our Privacy Policy, which is incorporated into these Terms by reference. By using the Service, you agree to the collection and use of information as described in the Privacy Policy.</p>
          </Section>

          <Section title="12. Limitation of Liability">
            <p>To the maximum extent permitted by applicable law, Propvian shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, revenue, data, or business opportunities, arising from your use of or inability to use the Service.</p>
            <p>Our total liability to you for any claim arising under these Terms shall not exceed the total amount paid by you to Propvian in the 12 months preceding the claim.</p>
            <p>Some jurisdictions do not allow limitations of liability — in such cases, our liability is limited to the fullest extent permitted by applicable law.</p>
          </Section>

          <Section title="13. Service Availability">
            <p>We aim to maintain high availability but do not guarantee uninterrupted access to the Service. Scheduled maintenance, emergency downtime, or third-party service outages may affect availability. We will make reasonable efforts to notify you of planned maintenance.</p>
          </Section>

          <Section title="14. Termination">
            <p>We may suspend or terminate your account if you violate these Terms, engage in fraudulent activity, or for any other reason with reasonable notice. Upon termination, your right to use the Service ceases. We may retain your data as required by law or for legitimate business purposes.</p>
          </Section>

          <Section title="15. Governing Law">
            <p>These Terms are governed by applicable law. Any disputes arising under these Terms shall be resolved through binding arbitration or in courts of competent jurisdiction, as applicable.</p>
          </Section>

          <Section title="16. Contact">
            <p>If you have questions about these Terms, please contact us through your account dashboard or at the contact information provided on the website.</p>
          </Section>
        </main>
        <MarketingFooter />
      </div>
    </>
  )
}

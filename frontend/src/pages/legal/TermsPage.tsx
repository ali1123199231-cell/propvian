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
        title="Terms of Service"
        description="Propvian Terms of Service — subscription terms, host responsibilities, billing, cancellation, and acceptable use for the Propvian direct booking platform."
        canonical="/legal/terms"
        noIndex={false}
      />
      <div className="min-h-screen flex flex-col bg-white">
        <MarketingNav />
        <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-14 w-full">
          <div className="mb-10">
            <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-2">Legal</p>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-3">Terms of Service</h1>
            <p className="text-sm text-gray-400">Last updated: June 2026 · Version 2.0</p>
          </div>

          <Section title="1. Acceptance of Terms">
            <p>By creating an account, activating a subscription, or otherwise using the Propvian platform (the "Service"), you ("Host," "you," or "your") agree to be bound by these Terms of Service ("Terms"). If you are acting on behalf of an organization, you represent that you have the authority to bind that organization to these Terms.</p>
            <p>We may update these Terms from time to time. We will provide at least 14 days' notice of material changes via email or a prominent notice in your account. Continued use of the Service after the effective date of revised Terms constitutes your acceptance of those changes.</p>
            <p>If you do not agree to these Terms, you must not use the Service.</p>
          </Section>

          <Section title="2. Description of Service — Software Infrastructure Only">
            <p>Propvian is a software-as-a-service (SaaS) platform that enables vacation rental hosts and short-term rental operators to create and operate direct-booking websites, manage property listings, accept guest reservations, process payments via connected third-party payment processors, and manage guest communications and bookings.</p>
            <p><strong>Propvian is exclusively software infrastructure. Propvian is not, and shall not be construed as, any of the following:</strong></p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>A travel agency or booking agency</li>
              <li>A vacation rental agency or property management company</li>
              <li>A party to any rental agreement, booking agreement, or guest contract</li>
              <li>An agent or representative of any host or guest</li>
              <li>A custodian, trustee, or fiduciary for any funds</li>
              <li>A landlord, property owner, or operator</li>
            </ul>
            <p>The Service is provided on an "as-is" and "as-available" basis. Features may change over time with reasonable notice.</p>
          </Section>

          <Section title="3. Propvian Is Not the Merchant of Record">
            <p>Propvian is not the merchant of record for any transaction that occurs through your direct booking website. All payments from guests are processed directly between the guest and the host via third-party payment processors (currently Stripe and/or PayPal). Propvian does not receive, hold, transmit, or process guest funds at any point.</p>
            <p>You, as the host, are solely responsible for all financial aspects of bookings made through your website, including but not limited to: collecting payment, issuing refunds, handling chargebacks and disputes, and complying with applicable tax obligations.</p>
            <p>Propvian is not a payment service provider, money services business, or payment facilitator under any applicable law.</p>
          </Section>

          <Section title="4. Host Responsibilities">
            <p>By using the Service, you acknowledge and agree that you are solely responsible for:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Property compliance:</strong> Ensuring your property is legally permitted for short-term rental use under all applicable local, regional, and national laws, regulations, ordinances, and licensing requirements</li>
              <li><strong>Listings accuracy:</strong> Maintaining accurate, truthful, and complete property listings, descriptions, photos, and availability information</li>
              <li><strong>Pricing and taxes:</strong> Setting your own prices, collecting applicable taxes (including VAT, GST, occupancy taxes, tourism levies, and any other applicable taxes), remitting taxes to the appropriate authorities, and complying with all applicable tax laws</li>
              <li><strong>Guest relationships:</strong> Managing all communications, agreements, disputes, damage claims, and interactions with guests</li>
              <li><strong>Guest contracts:</strong> Providing guests with any required rental agreements, house rules, or disclosures required by law or your own policies</li>
              <li><strong>Refunds and cancellations:</strong> Establishing and enforcing your own cancellation and refund policies with guests</li>
              <li><strong>Chargebacks:</strong> Responding to and bearing the financial responsibility for any payment chargebacks or disputes initiated by guests</li>
              <li><strong>Insurance:</strong> Maintaining adequate property and liability insurance coverage for your rental activity</li>
              <li><strong>Safety and property standards:</strong> Ensuring your property meets all applicable health, safety, and habitability standards</li>
              <li><strong>Data protection:</strong> Complying with applicable data protection laws in your dealings with guests, including under GDPR if applicable</li>
            </ul>
            <p>Propvian expressly disclaims any responsibility for your compliance with any of the above obligations.</p>
          </Section>

          <Section title="5. Accounts and Organizations">
            <p>You must provide accurate and complete information when creating your account. You are responsible for maintaining the confidentiality of your login credentials and for all activity that occurs under your account.</p>
            <p>Each account is associated with one organization. Multiple team members may be added to an organization at the owner's discretion. The account owner is responsible for all usage and obligations within the organization.</p>
            <p>You must promptly notify us of any unauthorized use of your account or any other security breach.</p>
          </Section>

          <Section title="6. Free Trial">
            <p>New accounts receive a free trial period as specified at the time of registration (currently 30 days). The trial provides access to Service features at no charge. No payment information is required to begin a trial.</p>
            <p>After the trial period, continued use of subscription features requires a paid subscription. If you do not subscribe, certain features will be suspended. Your data is retained during the inactive period in accordance with our data retention policies.</p>
            <p>Propvian reserves the right to modify trial terms with reasonable notice.</p>
          </Section>

          <Section title="7. Subscription, Billing, and Recurring Charges">
            <p><strong>Recurring billing disclosure:</strong> Propvian subscriptions are billed on a recurring monthly basis. By subscribing, you authorize Propvian to charge your payment method on each billing date for the applicable subscription fee until you cancel.</p>
            <p>Current pricing is displayed on the Pricing page. Propvian reserves the right to change subscription pricing with at least 30 days' written notice to existing subscribers. Price changes take effect on your next billing cycle after the notice period.</p>
            <p>Payment is processed through Stripe. By providing payment information, you represent that you are authorized to use the payment method and authorize charges to it.</p>
            <p>If a payment fails, we will notify you and attempt to reprocess the charge. Access to subscription features may be suspended if payment remains outstanding after reasonable collection attempts. You are responsible for ensuring your payment information remains current.</p>
            <p>All fees are stated in USD unless otherwise specified and are exclusive of applicable taxes. You are responsible for all applicable taxes related to your use of the Service.</p>
          </Section>

          <Section title="8. Cancellation">
            <p>You may cancel your subscription at any time from your billing settings. Cancellation takes effect at the end of your current billing period — you retain full access to the Service until that date.</p>
            <p>We do not provide prorated refunds for partial billing periods upon cancellation. Your subscription will not automatically renew after cancellation.</p>
          </Section>

          <Section title="9. Acceptable Use">
            <p>You agree not to use the Service to:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>List, advertise, or rent properties that you do not own or are not authorized to rent</li>
              <li>Engage in fraudulent, deceptive, or misleading activity toward guests, Propvian, or any third party</li>
              <li>List properties in violation of applicable law, local ordinances, or HOA/lease agreements</li>
              <li>Process payments for goods or services other than legitimate short-term property rentals</li>
              <li>Transmit spam, unsolicited communications, or automated messages in violation of applicable anti-spam laws</li>
              <li>Access, or attempt to access, another user's account, data, or systems</li>
              <li>Reverse engineer, decompile, or attempt to extract source code from the Service</li>
              <li>Use the Service for money laundering, terrorism financing, or other financial crimes</li>
              <li>Circumvent any security, access control, or rate-limiting mechanisms</li>
              <li>Resell or sublicense the Service without written permission from Propvian</li>
              <li>Upload malicious code, viruses, or content designed to disrupt the Service</li>
              <li>Use the Service in any manner that violates applicable law</li>
            </ul>
            <p>Propvian reserves the right to investigate suspected violations and to suspend or terminate accounts accordingly. Please see our <a href="/legal/acceptable-use" className="text-primary-600 hover:underline">Acceptable Use Policy</a> for additional detail.</p>
          </Section>

          <Section title="10. Content and Intellectual Property">
            <p><strong>Your content:</strong> You retain ownership of all content you upload to the Service, including property listings, photos, descriptions, and pricing data ("Host Content"). By uploading Host Content, you grant Propvian a limited, non-exclusive, royalty-free license to store, display, and process your content solely as necessary to provide the Service.</p>
            <p><strong>Propvian IP:</strong> Propvian and its licensors own all intellectual property rights in the Service, including software, platform code, designs, trademarks, and documentation. These Terms do not grant you any ownership rights in the Service.</p>
            <p><strong>Content responsibility:</strong> You are solely responsible for ensuring that Host Content does not infringe third-party intellectual property rights, violate privacy rights, or contain illegal content. Propvian may remove content that violates these Terms upon notice.</p>
          </Section>

          <Section title="11. Privacy and Data Processing">
            <p>Your use of the Service is governed by our <a href="/legal/privacy" className="text-primary-600 hover:underline">Privacy Policy</a>, which is incorporated into these Terms by reference. Propvian processes your personal data as described in the Privacy Policy.</p>
            <p>To the extent Propvian processes personal data of guests on your behalf as part of providing the Service, Propvian acts as a data processor and you act as the data controller. This relationship is governed by our <a href="/legal/dpa" className="text-primary-600 hover:underline">Data Processing Agreement</a>.</p>
          </Section>

          <Section title="12. Third-Party Services">
            <p>The Service integrates with and relies on third-party services including Stripe, PayPal, and email delivery providers. These integrations are subject to the terms and availability of those third-party services. Propvian is not responsible for any disruptions or changes to third-party services.</p>
            <p>Your use of payment processors is subject to their own terms of service. We are not affiliated with, endorsed by, or responsible for these third-party providers.</p>
          </Section>

          <Section title="13. Disclaimer of Warranties">
            <p>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT ANY WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, PROPVIAN EXPRESSLY DISCLAIMS ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, AND UNINTERRUPTED OR ERROR-FREE OPERATION.</p>
            <p>Propvian does not warrant that: (a) the Service will meet your specific requirements; (b) the Service will be available at any particular time; (c) any errors will be corrected; or (d) data processed through the Service will be secure or free from loss. Some jurisdictions do not allow the exclusion of implied warranties — in such cases this disclaimer applies to the maximum extent permitted by law.</p>
          </Section>

          <Section title="14. Limitation of Liability">
            <p>TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, PROPVIAN SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, PUNITIVE, OR EXEMPLARY DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, REVENUE, DATA, GOODWILL, BOOKINGS, GUEST RELATIONSHIPS, OR BUSINESS OPPORTUNITIES, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF OR INABILITY TO USE THE SERVICE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.</p>
            <p><strong>Liability cap:</strong> Propvian's total cumulative liability to you for any and all claims arising under or related to these Terms shall not exceed the total subscription fees you actually paid to Propvian in the 12 months immediately preceding the claim giving rise to liability.</p>
            <p>Propvian is not liable for: (a) any dispute, claim, loss, or damage arising between you and any guest; (b) your failure to comply with applicable laws; (c) any tax obligations; (d) any chargeback or payment dispute; (e) any third-party service failure.</p>
            <p>Some jurisdictions do not allow limitations of liability — in such cases our liability is limited to the fullest extent permitted by law.</p>
          </Section>

          <Section title="15. Indemnification">
            <p>You agree to defend, indemnify, and hold harmless Propvian, its officers, directors, employees, contractors, and agents from and against any and all claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys' fees) arising out of or related to: (a) your use of the Service; (b) your Host Content; (c) your violation of these Terms; (d) your violation of any applicable law or third-party right; (e) any dispute between you and any guest; (f) your rental activity; or (g) your failure to collect or remit applicable taxes.</p>
          </Section>

          <Section title="16. Force Majeure">
            <p>Propvian shall not be liable for any delay or failure to perform any obligation under these Terms to the extent caused by events beyond our reasonable control, including natural disasters, war, terrorism, pandemics, government actions, power failures, internet outages, third-party service disruptions, or other force majeure events. We will make reasonable efforts to resume performance as soon as practicable.</p>
          </Section>

          <Section title="17. Service Availability">
            <p>Propvian aims to provide a reliable service but does not guarantee uninterrupted, error-free, or continuously available access. Planned maintenance, emergency downtime, third-party outages, or other events may affect availability. We will make reasonable efforts to notify you of planned maintenance in advance.</p>
            <p>Service level commitments, if any, will be stated in a separate Service Level Agreement or on our Status page.</p>
          </Section>

          <Section title="18. Suspension and Termination">
            <p><strong>By you:</strong> You may terminate your account at any time by cancelling your subscription and contacting us to request account deletion. See our <a href="/legal/privacy" className="text-primary-600 hover:underline">Privacy Policy</a> for data deletion procedures.</p>
            <p><strong>By Propvian:</strong> We may suspend or terminate your account immediately without prior notice if we reasonably believe that you have: violated these Terms or our Acceptable Use Policy; engaged in fraudulent, abusive, or illegal activity; created risk or legal exposure for Propvian; or failed to pay subscription fees after reasonable attempts to collect.</p>
            <p>We may also terminate the Service entirely upon 30 days' notice to all users.</p>
            <p>Upon termination: your right to access the Service ceases; we will retain your data in accordance with our data retention policies; and any outstanding payment obligations remain due.</p>
          </Section>

          <Section title="19. Content Removal and Moderation">
            <p>Propvian reserves the right to remove any content, suspend any listing, or restrict any account that we determine, in our sole discretion, violates these Terms, our Acceptable Use Policy, or applicable law. This includes but is not limited to fraudulent listings, illegal content, spam, and abusive activity.</p>
            <p>We are under no obligation to monitor content but may do so at our discretion.</p>
          </Section>

          <Section title="20. Governing Law and Dispute Resolution">
            <p>These Terms are governed by and construed in accordance with applicable law, without regard to conflict of law principles. Any dispute arising under these Terms that cannot be resolved informally shall be submitted to binding arbitration or litigation in a court of competent jurisdiction, as applicable under the laws of the jurisdiction where Propvian is incorporated.</p>
            <p>You agree to first attempt to resolve any dispute informally by contacting Propvian at support@propvian.com. If a dispute is not resolved within 30 days, either party may pursue formal proceedings.</p>
          </Section>

          <Section title="21. General Provisions">
            <p><strong>Entire agreement:</strong> These Terms, together with the Privacy Policy, Cookie Policy, and any other policies incorporated by reference, constitute the entire agreement between you and Propvian regarding the Service.</p>
            <p><strong>Severability:</strong> If any provision of these Terms is found to be unenforceable, that provision will be modified to the minimum extent necessary to make it enforceable, and the remaining provisions will remain in full force.</p>
            <p><strong>Waiver:</strong> Failure by Propvian to enforce any provision of these Terms shall not constitute a waiver of that provision.</p>
            <p><strong>Assignment:</strong> You may not assign your rights or obligations under these Terms without our prior written consent. Propvian may assign these Terms in connection with a merger, acquisition, or sale of assets.</p>
          </Section>

          <Section title="22. Contact">
            <p>If you have questions about these Terms, please contact us at <a href="mailto:support@propvian.com" className="text-primary-600 hover:underline">support@propvian.com</a> or through your account dashboard.</p>
            <p>For legal notices, please send written correspondence to the address provided in your account settings or on the contact page.</p>
          </Section>
        </main>
        <MarketingFooter />
      </div>
    </>
  )
}

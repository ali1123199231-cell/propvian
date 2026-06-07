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

export function DmcaPage() {
  return (
    <>
      <SEOHead
        title="Copyright & DMCA Policy"
        description="Propvian Copyright and DMCA Policy — how to submit a copyright takedown notice or counter-notification for content on the Propvian platform."
        canonical="/legal/dmca"
      />
      <div className="min-h-screen flex flex-col bg-white">
        <MarketingNav />
        <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-14 w-full">
          <div className="mb-10">
            <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-2">Legal</p>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-3">Copyright &amp; DMCA Policy</h1>
            <p className="text-sm text-gray-400">Last updated: June 2026</p>
          </div>

          <Section title="1. Respect for Intellectual Property">
            <p>Propvian respects the intellectual property rights of others and expects hosts using our platform to do the same. It is our policy to respond promptly to valid claims of copyright infringement in accordance with the Digital Millennium Copyright Act (DMCA) and equivalent legislation where applicable.</p>
            <p>Hosts are solely responsible for the content they upload to the platform, including property photos, descriptions, and other media. By uploading content, hosts represent that they own or have the right to use that content.</p>
          </Section>

          <Section title="2. Reporting Copyright Infringement (Takedown Notice)">
            <p>If you believe that content posted on a Propvian-powered website infringes your copyright, you may submit a DMCA takedown notice to our designated copyright agent. Your notice must include all of the following:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>A physical or electronic signature of the copyright owner or authorized representative</li>
              <li>Identification of the copyrighted work(s) claimed to be infringed (or a representative list if multiple works are covered)</li>
              <li>Identification of the infringing material and its location on the platform (URL or sufficient detail to locate it)</li>
              <li>Your contact information: name, address, telephone number, and email address</li>
              <li>A statement that you have a good faith belief that the use is not authorized by the copyright owner, its agent, or the law</li>
              <li>A statement, under penalty of perjury, that the information in the notice is accurate and that you are the copyright owner or authorized to act on the copyright owner's behalf</li>
            </ul>
            <p>Submit notices to our designated agent:</p>
            <div className="bg-gray-50 rounded-xl p-4 text-sm font-mono text-gray-700">
              <p>Email: <a href="mailto:dmca@propvian.com" className="text-primary-600 hover:underline">dmca@propvian.com</a></p>
              <p>Subject line: DMCA Takedown Notice</p>
            </div>
            <p><strong>Warning:</strong> Under 17 U.S.C. § 512(f), any person who knowingly materially misrepresents that material is infringing may be subject to liability. Please be certain before submitting a takedown notice.</p>
          </Section>

          <Section title="3. Our Response to Takedown Notices">
            <p>Upon receipt of a valid, complete DMCA takedown notice, Propvian will:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Acknowledge receipt within 3 business days</li>
              <li>Investigate the claim and, if appropriate, remove or disable access to the allegedly infringing content</li>
              <li>Notify the host who posted the content that it has been removed or disabled</li>
              <li>Retain records of notices as required by applicable law</li>
            </ul>
            <p>We may forward a copy of the takedown notice (with personal contact information redacted) to the affected host.</p>
          </Section>

          <Section title="4. Counter-Notification">
            <p>If you are a host and you believe that content removed in response to a DMCA notice was removed in error or misidentification, you may submit a counter-notification. Your counter-notification must include:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Your physical or electronic signature</li>
              <li>Identification of the content that was removed and its location before removal</li>
              <li>A statement under penalty of perjury that you have a good faith belief that the content was removed or disabled as a result of mistake or misidentification</li>
              <li>Your name, address, telephone number, and email address</li>
              <li>A statement that you consent to the jurisdiction of the Federal District Court for the judicial district in which you reside (or, if outside the US, to the jurisdiction of any judicial district in which Propvian may be found), and that you will accept service of process from the person who submitted the original takedown notice</li>
            </ul>
            <p>Submit counter-notifications to: <a href="mailto:dmca@propvian.com" className="text-primary-600 hover:underline">dmca@propvian.com</a></p>
            <p>If we receive a valid counter-notification, we will notify the original complainant and may restore the content after 10–14 business days unless we receive notice that the complainant has filed a court action.</p>
          </Section>

          <Section title="5. Repeat Infringers">
            <p>Propvian has a policy of terminating the accounts of users who are repeat infringers of intellectual property rights, in appropriate circumstances and at our sole discretion.</p>
          </Section>

          <Section title="6. Propvian's Intellectual Property">
            <p>The Propvian name, logo, platform design, software, and documentation are the intellectual property of Propvian and are protected by applicable copyright, trademark, and other laws. You may not copy, reproduce, distribute, or create derivative works from any Propvian materials without express written permission.</p>
          </Section>

          <Section title="7. Contact">
            <p>DMCA and copyright inquiries: <a href="mailto:dmca@propvian.com" className="text-primary-600 hover:underline">dmca@propvian.com</a></p>
            <p>General support: <a href="mailto:support@propvian.com" className="text-primary-600 hover:underline">support@propvian.com</a></p>
          </Section>
        </main>
        <MarketingFooter />
      </div>
    </>
  )
}

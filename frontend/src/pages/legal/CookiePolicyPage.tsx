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

interface CookieRow {
  name: string
  purpose: string
  type: string
  duration: string
}

function CookieTable({ cookies }: { cookies: CookieRow[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 mt-4">
      <table className="w-full text-xs">
        <thead className="bg-gray-50">
          <tr>
            {['Name', 'Purpose', 'Type', 'Duration'].map((h) => (
              <th key={h} className="text-left px-4 py-3 text-gray-500 font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {cookies.map((row) => (
            <tr key={row.name}>
              <td className="px-4 py-3 font-mono text-gray-700">{row.name}</td>
              <td className="px-4 py-3 text-gray-600">{row.purpose}</td>
              <td className="px-4 py-3 text-gray-600">{row.type}</td>
              <td className="px-4 py-3 text-gray-600">{row.duration}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function CookiePolicyPage() {
  return (
    <>
      <SEOHead
        title="Cookie Policy"
        description="Propvian Cookie Policy — what cookies we use, why we use them, and how to control them. Covers essential, analytics, and third-party cookies."
        canonical="/legal/cookie-policy"
      />
      <div className="min-h-screen flex flex-col bg-white">
        <MarketingNav />
        <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-14 w-full">
          <div className="mb-10">
            <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-2">Legal</p>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-3">Cookie Policy</h1>
            <p className="text-sm text-gray-400">Last updated: June 2026 · Version 2.0</p>
          </div>

          <Section title="1. What Are Cookies">
            <p>Cookies are small text files stored on your device when you visit a website. They allow the website to recognize your browser across sessions, remember preferences, and collect usage information. Similar technologies include local storage, session storage, and pixel tags (also called web beacons).</p>
            <p>This policy applies to cookies and similar technologies used on the Propvian platform at propvian.com and any subdomain or related services.</p>
          </Section>

          <Section title="2. Cookie Categories">
            <p>We categorize our cookies as follows:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Strictly Necessary:</strong> Essential for the Service to function. These enable authentication, session management, and security protections. You cannot opt out of these while using the Service, as they are required for it to operate.</li>
              <li><strong>Functional:</strong> Remember your preferences and settings (such as selected organization, UI state). Disabling these may degrade your experience but will not prevent you from using core features.</li>
              <li><strong>Analytics:</strong> Collect aggregated, anonymized information about how visitors use the platform. Used to improve the Service. These are optional and require your consent under applicable law.</li>
              <li><strong>Third-party:</strong> Set by our payment processors (Stripe, PayPal) when you interact with their payment elements. Governed by the respective third-party privacy policies.</li>
            </ul>
          </Section>

          <Section title="3. Cookies We Use">
            <p><strong>Strictly Necessary:</strong></p>
            <CookieTable cookies={[
              { name: 'auth_token', purpose: 'Authenticates your session in the application', type: 'Strictly Necessary', duration: 'Session' },
              { name: 'refresh_token', purpose: 'Renews authentication session without requiring re-login', type: 'Strictly Necessary', duration: '30 days' },
              { name: 'csrf_token', purpose: 'Cross-site request forgery protection', type: 'Strictly Necessary', duration: 'Session' },
            ]} />

            <p className="mt-5"><strong>Analytics (optional — requires consent):</strong></p>
            <CookieTable cookies={[
              { name: '_analytics_*', purpose: 'Aggregated usage analytics — page views, feature usage, session data', type: 'Analytics', duration: 'Up to 13 months' },
            ]} />

            <p className="mt-5"><strong>Third-party (Stripe and PayPal):</strong></p>
            <p>Our payment processors may set cookies when you view or interact with payment elements. These cookies are set by Stripe and PayPal respectively and are governed by their privacy policies. Propvian does not control these cookies.</p>
          </Section>

          <Section title="4. What We Do NOT Use Cookies For">
            <p>Propvian does not use cookies or similar technologies for:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Behavioral or interest-based advertising</li>
              <li>Cross-site tracking for advertising networks</li>
              <li>Retargeting campaigns</li>
              <li>Selling or sharing cookie data with data brokers</li>
            </ul>
          </Section>

          <Section title="5. Your Cookie Choices and Consent">
            <p>Where required by applicable law (including the EU ePrivacy Directive and GDPR), we obtain your consent before setting non-essential cookies. You may:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Accept all cookies</strong> via the cookie banner when you first visit</li>
              <li><strong>Decline non-essential cookies</strong> via the cookie banner</li>
              <li><strong>Change your preferences</strong> at any time via your browser settings or by clearing cookies</li>
            </ul>
            <p>Withdrawing consent for analytics cookies does not affect the legality of processing based on consent before withdrawal.</p>
          </Section>

          <Section title="6. Controlling Cookies via Your Browser">
            <p>You can control cookies through your browser settings. Most browsers allow you to block or delete cookies. Note that blocking strictly necessary cookies will prevent the Service from functioning correctly.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Chrome: Settings → Privacy and security → Cookies and other site data</li>
              <li>Firefox: Settings → Privacy & Security → Cookies and Site Data</li>
              <li>Safari: Preferences → Privacy → Manage Website Data</li>
              <li>Edge: Settings → Cookies and site permissions</li>
            </ul>
          </Section>

          <Section title="7. Do Not Track">
            <p>Some browsers offer a "Do Not Track" (DNT) signal. There is currently no consistent industry standard for responding to DNT signals. We process DNT signals on a best-effort basis, consistent with our analytics data practices.</p>
          </Section>

          <Section title="8. Changes to This Policy">
            <p>We may update this Cookie Policy as we change our use of tracking technologies. We will communicate material changes via notice in the application or by email, and update the version and date at the top of this page.</p>
          </Section>

          <Section title="9. Contact">
            <p>For questions about our cookie practices, contact us at <a href="mailto:privacy@propvian.com" className="text-primary-600 hover:underline">privacy@propvian.com</a> or through your account dashboard.</p>
          </Section>
        </main>
        <MarketingFooter />
      </div>
    </>
  )
}

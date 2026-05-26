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
        title="Cookie Policy | Propvian"
        description="Propvian Cookie Policy — what cookies we use, why, and how to control them. Covers analytics cookies, functional cookies, and tracking technologies."
        canonical="/legal/cookie-policy"
      />
      <div className="min-h-screen flex flex-col bg-white">
        <MarketingNav />
        <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-14 w-full">
          <div className="mb-10">
            <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-2">Legal</p>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-3">Cookie Policy</h1>
            <p className="text-sm text-gray-400">Last updated: May 2025</p>
          </div>

          <Section title="1. What Are Cookies">
            <p>Cookies are small text files stored on your device when you visit a website. They allow the website to recognize your browser across sessions, remember preferences, and collect usage information. Similar technologies include local storage, session storage, and pixel tags.</p>
          </Section>

          <Section title="2. How We Use Cookies">
            <p>Propvian uses cookies for the following purposes:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Strictly necessary cookies:</strong> Required for the Service to function. These include authentication tokens that keep you logged in and CSRF protection tokens. You cannot opt out of these while using the Service.</li>
              <li><strong>Functional cookies:</strong> Remember your preferences (e.g., selected organization, UI settings). Disabling these may affect your experience.</li>
              <li><strong>Analytics cookies:</strong> Collect aggregated, anonymized data about how visitors use the website and product. This helps us improve the Service. These are optional and can be disabled.</li>
            </ul>
          </Section>

          <Section title="3. Cookies We Use">
            <p><strong>Essential cookies:</strong></p>
            <CookieTable cookies={[
              { name: 'auth_token', purpose: 'Keeps you authenticated in the application', type: 'Essential', duration: 'Session' },
              { name: 'refresh_token', purpose: 'Used to renew authentication without re-login', type: 'Essential', duration: '30 days' },
            ]} />

            <p className="mt-5"><strong>Analytics cookies (optional):</strong></p>
            <p>If we use third-party analytics (such as Google Analytics), those tools may set their own cookies. These are governed by the respective third-party privacy policies. You can opt out of Google Analytics tracking via Google's opt-out browser add-on.</p>
          </Section>

          <Section title="4. Third-Party Cookies">
            <p>Our payment providers (Stripe and PayPal) may set cookies when you interact with their payment forms embedded in or linked from our Service. These cookies are governed by Stripe's and PayPal's respective cookie policies.</p>
            <p>We do not use third-party advertising cookies or behavioral tracking cookies.</p>
          </Section>

          <Section title="5. Controlling Cookies">
            <p>You can control cookies through your browser settings. Most browsers allow you to block or delete cookies. Note that blocking essential cookies will prevent you from using the Service.</p>
            <p>Browser-specific instructions for managing cookies:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Chrome: Settings → Privacy and security → Cookies</li>
              <li>Firefox: Settings → Privacy & Security → Cookies and Site Data</li>
              <li>Safari: Preferences → Privacy → Cookies</li>
              <li>Edge: Settings → Cookies and site permissions</li>
            </ul>
          </Section>

          <Section title="6. Do Not Track">
            <p>Some browsers offer a "Do Not Track" (DNT) signal. We currently do not have a standardized response to DNT signals, consistent with the lack of industry standards for this feature.</p>
          </Section>

          <Section title="7. Changes to This Policy">
            <p>We may update this Cookie Policy as we change our use of tracking technologies. Material changes will be communicated via notice in the application or by email.</p>
          </Section>

          <Section title="8. Contact">
            <p>For questions about our cookie use, contact us through your account dashboard or at the contact information on the website.</p>
          </Section>
        </main>
        <MarketingFooter />
      </div>
    </>
  )
}

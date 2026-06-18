import { Link } from 'react-router-dom'
import { Clock, ArrowRight, Tag } from 'lucide-react'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'
import { CTASection } from '@/components/marketing/CTASection'
import { SEOHead } from '@/components/seo/SEOHead'
import { blogPosts } from '@/data/blog/posts'

const CATEGORY_COLORS: Record<string, string> = {
  'Airbnb Hosting': 'bg-rose-100 text-rose-700',
  'Property Management': 'bg-blue-100 text-blue-700',
  'Equipment & Hardware': 'bg-amber-100 text-amber-700',
  'Guest Experience': 'bg-emerald-100 text-emerald-700',
  'Automation': 'bg-primary-100 text-primary-700',
  'Guides': 'bg-purple-100 text-purple-700',
  'Direct Bookings': 'bg-teal-100 text-teal-700',
}

const blogSchema = {
  '@context': 'https://schema.org',
  '@type': 'Blog',
  name: 'Propvian Blog',
  description:
    'Guides, tips, and best practices for Airbnb hosts and vacation rental operators on smart lock automation and guest access management.',
  url: 'https://propvian.com/blog',
  publisher: {
    '@type': 'Organization',
    name: 'Propvian',
    url: 'https://propvian.com',
  },
}

export function BlogListPage() {
  const featured = blogPosts.filter((p) => p.featured)
  const rest = blogPosts.filter((p) => !p.featured)

  return (
    <>
      <SEOHead
        title="Blog — Smart Lock Automation for Short-Term Rentals"
        description="Guides and tips on Airbnb automation, TTLock setup, self check-in systems, and vacation rental operations for hosts and property managers."
        canonical="/blog"
        schema={blogSchema}
      />
      <div className="min-h-screen flex flex-col bg-white">
        <MarketingNav />

        {/* Hero */}
        <section className="bg-gradient-to-b from-gray-50 to-white border-b border-gray-100 py-14 sm:py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
            <p className="text-sm font-semibold text-primary-600 uppercase tracking-widest mb-3">Propvian Blog</p>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
              Smart lock guides for Airbnb hosts
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Practical articles on automation, TTLock setup, self check-in, and running a more efficient short-term rental operation.
            </p>
          </div>
        </section>

        <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 py-14">
          {/* Featured posts */}
          {featured.length > 0 && (
            <div className="mb-14">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-6">Featured Articles</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {featured.map((post) => (
                  <Link
                    key={post.slug}
                    to={`/blog/${post.slug}`}
                    className="group block border border-gray-200 rounded-2xl p-7 hover:border-primary-300 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${CATEGORY_COLORS[post.category] || 'bg-gray-100 text-gray-600'}`}>
                        <Tag size={11} /> {post.category}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary-700 transition-colors mb-2 leading-snug">
                      {post.title}
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed mb-4 line-clamp-3">{post.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock size={12} /> {post.readingTime} min read
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 group-hover:gap-2 transition-all">
                        Read article <ArrowRight size={12} />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* All posts */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-6">All Articles</h2>
            <div className="divide-y divide-gray-100">
              {rest.map((post) => (
                <Link
                  key={post.slug}
                  to={`/blog/${post.slug}`}
                  className="group flex flex-col sm:flex-row sm:items-start gap-4 py-6 hover:bg-gray-50 -mx-4 px-4 rounded-xl transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[post.category] || 'bg-gray-100 text-gray-600'}`}>
                        {post.category}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center gap-1"><Clock size={11} /> {post.readingTime} min</span>
                    </div>
                    <h3 className="text-base font-bold text-gray-900 group-hover:text-primary-700 transition-colors mb-1">
                      {post.title}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-2">{post.description}</p>
                  </div>
                  <ArrowRight size={16} className="flex-shrink-0 text-gray-300 group-hover:text-primary-500 transition-colors mt-1 self-start sm:self-center" />
                </Link>
              ))}
            </div>
          </div>
        </main>

        <CTASection />
        <MarketingFooter />
      </div>
    </>
  )
}

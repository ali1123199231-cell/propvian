import { useParams, Link, Navigate } from 'react-router-dom'
import { Clock, ArrowLeft, ArrowRight, Calendar, Tag } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'
import { FAQSection, faqSchema } from '@/components/marketing/FAQSection'
import { SEOHead } from '@/components/seo/SEOHead'
import { blogPosts, type BlogSection } from '@/data/blog/posts'

function RenderSection({ section }: { section: BlogSection }) {
  const navigate = useNavigate()

  switch (section.type) {
    case 'h2':
      return <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-10 mb-4">{section.content}</h2>
    case 'h3':
      return <h3 className="text-lg font-bold text-gray-800 mt-6 mb-3">{section.content}</h3>
    case 'p':
      return <p className="text-gray-600 leading-relaxed mb-4">{section.content}</p>
    case 'ul':
      return (
        <ul className="space-y-2 mb-4 pl-1">
          {section.items?.map((item, i) => (
            <li key={i} className="flex items-start gap-3 text-gray-600 text-sm leading-relaxed">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-500 flex-shrink-0 mt-2" />
              {item}
            </li>
          ))}
        </ul>
      )
    case 'ol':
      return (
        <ol className="space-y-2.5 mb-4 pl-1">
          {section.items?.map((item, i) => (
            <li key={i} className="flex items-start gap-3 text-gray-600 text-sm leading-relaxed">
              <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              {item}
            </li>
          ))}
        </ol>
      )
    case 'tip':
      return (
        <div className="flex items-start gap-3 bg-primary-50 border border-primary-200 rounded-xl p-4 mb-4">
          <span className="text-primary-600 font-bold text-xs flex-shrink-0 mt-0.5 uppercase tracking-wide">Tip</span>
          <p className="text-sm text-primary-800 leading-relaxed">{section.content}</p>
        </div>
      )
    case 'faq':
      return section.faqs ? (
        <div className="mt-10 border-t border-gray-100 pt-10">
          <FAQSection items={section.faqs.map((f) => ({ question: f.q, answer: f.a }))} />
        </div>
      ) : null
    case 'cta':
      return (
        <div className="my-10 bg-gradient-to-br from-primary-600 to-indigo-700 rounded-2xl p-8 text-center">
          <p className="text-white font-bold text-lg mb-2">{section.content}</p>
          <p className="text-primary-100 text-sm mb-5">Free for 1 month. No credit card required.</p>
          <button
            onClick={() => navigate('/', { state: { tab: 'signup' } })}
            className="inline-flex items-center gap-2 bg-white text-primary-700 hover:bg-primary-50 font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
          >
            Start Free Trial <ArrowRight size={14} />
          </button>
        </div>
      )
    default:
      return null
  }
}

export function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>()
  const post = blogPosts.find((p) => p.slug === slug)

  if (!post) return <Navigate to="/blog" replace />

  const postIndex = blogPosts.indexOf(post)
  const prev = postIndex > 0 ? blogPosts[postIndex - 1] : null
  const next = postIndex < blogPosts.length - 1 ? blogPosts[postIndex + 1] : null

  const faqSections = post.sections.filter((s) => s.type === 'faq' && s.faqs)
  const allFaqs = faqSections.flatMap((s) => s.faqs || []).map((f) => ({ question: f.q, answer: f.a }))

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    author: { '@type': 'Organization', name: post.author },
    publisher: {
      '@type': 'Organization',
      name: 'Propvian',
      url: 'https://propvian.com',
    },
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    keywords: post.tags.join(', '),
    url: `https://propvian.com/blog/${post.slug}`,
  }

  const schemas: Record<string, unknown>[] = [articleSchema]
  if (allFaqs.length > 0) schemas.push(faqSchema(allFaqs))

  return (
    <>
      <SEOHead
        title={post.title}
        description={post.description}
        canonical={`/blog/${post.slug}`}
        ogType="article"
        article={{
          publishedTime: post.publishedAt,
          modifiedTime: post.updatedAt,
          author: post.author,
          tags: post.tags,
        }}
        schema={schemas}
      />
      <div className="min-h-screen flex flex-col bg-white">
        <MarketingNav />

        <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-12 w-full">
          {/* Back */}
          <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-8 transition-colors">
            <ArrowLeft size={14} /> Back to blog
          </Link>

          {/* Header */}
          <header className="mb-10">
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-700 bg-primary-50 border border-primary-200 px-3 py-1 rounded-full">
                <Tag size={11} /> {post.category}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-gray-400">
                <Calendar size={11} />
                {new Date(post.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-gray-400">
                <Clock size={11} /> {post.readingTime} min read
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight mb-5">
              {post.title}
            </h1>
            <p className="text-lg text-gray-500 leading-relaxed">{post.description}</p>
          </header>

          <div className="border-t border-gray-100 pt-10">
            {/* Article body */}
            <article className="prose-sm sm:prose max-w-none">
              {post.sections.map((section, i) => (
                <RenderSection key={i} section={section} />
              ))}
            </article>
          </div>

          {/* Tags */}
          <div className="mt-10 pt-6 border-t border-gray-100">
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span key={tag} className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Prev / Next */}
          <div className="mt-10 grid grid-cols-2 gap-4">
            {prev ? (
              <Link to={`/blog/${prev.slug}`} className="group border border-gray-200 rounded-xl p-4 hover:border-primary-300 transition-all">
                <p className="text-xs text-gray-400 mb-1 flex items-center gap-1"><ArrowLeft size={11} /> Previous</p>
                <p className="text-sm font-semibold text-gray-800 group-hover:text-primary-700 transition-colors line-clamp-2">{prev.title}</p>
              </Link>
            ) : <div />}
            {next ? (
              <Link to={`/blog/${next.slug}`} className="group border border-gray-200 rounded-xl p-4 hover:border-primary-300 transition-all text-right">
                <p className="text-xs text-gray-400 mb-1 flex items-center gap-1 justify-end">Next <ArrowRight size={11} /></p>
                <p className="text-sm font-semibold text-gray-800 group-hover:text-primary-700 transition-colors line-clamp-2">{next.title}</p>
              </Link>
            ) : <div />}
          </div>
        </main>

        <MarketingFooter />
      </div>
    </>
  )
}

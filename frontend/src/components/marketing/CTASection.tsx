import { useNavigate } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'

interface CTASectionProps {
  title?: string
  subtitle?: string
  badges?: string[]
  primary?: string
  secondary?: string
}

export function CTASection({
  title = 'Start automating your guest access today',
  subtitle = 'Join hosts who save hours every week with automatic lock code management.',
  badges = ['Free for 1 month', 'No credit card required', 'Setup in 5 minutes'],
  primary = 'Start Free Trial',
  secondary = 'See Pricing',
}: CTASectionProps) {
  const navigate = useNavigate()
  return (
    <section className="py-16 sm:py-20 bg-gradient-to-br from-primary-600 to-indigo-700">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">{title}</h2>
        <p className="text-primary-100 text-lg mb-8 leading-relaxed">{subtitle}</p>
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {badges.map((b) => (
            <div key={b} className="flex items-center gap-2 bg-white/15 rounded-full px-4 py-1.5">
              <Check size={13} className="text-primary-200" />
              <span className="text-sm text-white font-medium">{b}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={() => navigate('/', { state: { tab: 'signup' } })}
            className="inline-flex items-center justify-center gap-2 bg-white text-primary-700 hover:bg-primary-50 font-semibold px-8 py-3 rounded-xl transition-colors text-sm">
            {primary} <ArrowRight size={16} />
          </button>
          <button onClick={() => navigate('/pricing')}
            className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-medium px-8 py-3 rounded-xl transition-colors text-sm">
            {secondary}
          </button>
        </div>
      </div>
    </section>
  )
}

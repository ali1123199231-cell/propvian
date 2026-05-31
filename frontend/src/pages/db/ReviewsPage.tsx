import { Star, MessageSquare } from 'lucide-react'

function StarRow({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star key={i} size={14}
          className={i < count ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'} />
      ))}
    </div>
  )
}

export function ReviewsPage() {
  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
        <p className="text-gray-500 mt-1">Guest reviews and ratings for your properties</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Average rating', value: '—' },
          { label: 'Total reviews',  value: '0' },
          { label: 'Response rate',  value: '—' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Empty state */}
      <div className="bg-white rounded-xl border border-gray-200 p-12 flex flex-col items-center text-gray-400">
        <Star size={36} className="mb-3 opacity-30" />
        <p className="text-sm font-medium">No reviews yet</p>
        <p className="text-xs mt-1">Reviews from direct booking guests will appear here after their stay.</p>
      </div>

      {/* Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <MessageSquare size={14} className="text-primary-500" /> How reviews work
        </h2>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-primary-50 text-primary-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
            Guests automatically receive a review request email after checkout
          </li>
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-primary-50 text-primary-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
            Reviews appear on your public property page once submitted
          </li>
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-primary-50 text-primary-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
            You can reply to reviews from this page
          </li>
        </ul>
      </div>
    </div>
  )
}

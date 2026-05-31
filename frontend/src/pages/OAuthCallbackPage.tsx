import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

export function OAuthCallbackPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const provider       = params.get('provider') ?? 'unknown'
    const callbackStatus = params.get('status') ?? 'error'
    const accountId      = params.get('accountId')
    const email          = params.get('email')
    const chargesEnabled = params.get('chargesEnabled') === 'true'
    const payoutsEnabled = params.get('payoutsEnabled') === 'true'
    const errorMsg       = params.get('message') ?? 'Connection failed'

    if (callbackStatus === 'success') {
      setStatus('success')
      setMessage(provider === 'stripe'
        ? `Stripe connected: ${accountId}`
        : `PayPal connected: ${email}`)

      // Send result to parent window and close
      window.opener?.postMessage({
        type: 'OAUTH_CALLBACK',
        provider,
        status: 'success',
        accountId,
        email,
        chargesEnabled,
        payoutsEnabled,
      }, window.location.origin)

      setTimeout(() => window.close(), 1500)
    } else {
      setStatus('error')
      setMessage(errorMsg)

      window.opener?.postMessage({
        type: 'OAUTH_CALLBACK',
        provider,
        status: 'error',
        message: errorMsg,
      }, window.location.origin)

      setTimeout(() => window.close(), 3000)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
        {status === 'loading' && (
          <>
            <Loader2 size={32} className="animate-spin text-primary-500 mx-auto mb-4" />
            <p className="text-gray-600">Completing connection…</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle size={40} className="text-green-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Connected!</h2>
            <p className="text-sm text-gray-500 mb-3">{message}</p>
            <p className="text-xs text-gray-400">Closing automatically…</p>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle size={40} className="text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Connection failed</h2>
            <p className="text-sm text-gray-500 mb-3">{message}</p>
            <p className="text-xs text-gray-400">Closing automatically…</p>
          </>
        )}
      </div>
    </div>
  )
}

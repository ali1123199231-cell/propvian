import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Loader2, Nfc, X, SkipForward, ChevronLeft, CheckCircle2, Lock } from 'lucide-react'
import { adminTapCodesApi } from '@/api/guestPages'

// Web NFC ships in Chrome for Android only and has no TypeScript DOM types yet
type NdefReader = {
  write: (msg: { records: { recordType: string; data: string }[] }, opts?: { overwrite?: boolean; signal?: AbortSignal }) => Promise<void>
  makeReadOnly?: (opts?: { signal?: AbortSignal }) => Promise<void>
}
const webNfc = typeof window !== 'undefined' && 'NDEFReader' in window

/*
 * Writes a batch's codes onto NFC tags one after another, in the same order
 * the stand cards print in, so each tag goes behind the card with the same
 * code. Tags that already hold data are refused unless overwriting is allowed,
 * which catches the classic mistake of tapping the same tag twice.
 */
export function NfcBatchWriter({ batchLabel, onClose }: { batchLabel: string; onClose: () => void }) {
  const { data: batch, isLoading } = useQuery({ queryKey: ['tap-code-batch', batchLabel], queryFn: () => adminTapCodesApi.batch(batchLabel) })
  const [i, setI] = useState(0)
  const [lock, setLock] = useState(true)
  const [overwrite, setOverwrite] = useState(false)
  const [state, setState] = useState<'idle' | 'waiting' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [written, setWritten] = useState<Set<string>>(new Set())
  const abort = useRef<AbortController | null>(null)
  useEffect(() => () => abort.current?.abort(), [])

  const codes = batch?.codes ?? []
  const current = codes[i]

  const write = async () => {
    if (!current) return
    abort.current?.abort()
    abort.current = new AbortController()
    setState('waiting')
    setMessage('')
    try {
      const Reader = (window as unknown as { NDEFReader: new () => NdefReader }).NDEFReader
      const reader = new Reader()
      await reader.write({ records: [{ recordType: 'url', data: current.nfcUrl }] }, { overwrite, signal: abort.current.signal })
      if (lock && reader.makeReadOnly) await reader.makeReadOnly({ signal: abort.current.signal })
      setWritten((w) => new Set(w).add(current.code))
      setState('done')
      setTimeout(() => { setState('idle'); setI((n) => Math.min(n + 1, codes.length - 1)) }, 900)
    } catch (e) {
      if ((e as Error).name === 'AbortError') { setState('idle'); return }
      setState('error')
      setMessage((e as Error).name === 'NotAllowedError' && !overwrite
        ? 'This tag already holds data. Use a fresh tag, or tick "allow overwriting" if you mean to reuse it.'
        : (e as Error).message || 'The tag could not be written.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-700 bg-gray-900 p-6 text-gray-100 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <p className="font-semibold">Write NFC tags · {batchLabel}</p>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-800" aria-label="Close"><X size={18} /></button>
        </div>
        {!webNfc ? (
          <p className="text-sm text-gray-300">
            Open this page in Chrome on an Android phone to write tags here. Elsewhere, download the CSV and write each
            row's <span className="font-mono">nfc_url</span> with the NFC Tools app.
          </p>
        ) : isLoading || !current ? (
          <Loader2 className="animate-spin text-gray-500" />
        ) : (
          <>
            <p className="text-sm text-gray-400">Tag {i + 1} of {codes.length}. It goes behind the card printed with:</p>
            <p className="my-3 text-center font-mono text-4xl font-bold tracking-widest">{current.code}</p>
            {written.has(current.code) && <p className="mb-2 text-center text-xs text-green-400">Already written in this session</p>}
            <button type="button" onClick={write} disabled={state === 'waiting'}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-3.5 font-semibold text-gray-900 hover:bg-amber-400 disabled:opacity-60">
              {state === 'waiting' ? <Loader2 size={18} className="animate-spin" /> : state === 'done' ? <CheckCircle2 size={18} /> : <Nfc size={18} />}
              {state === 'waiting' ? 'Hold the tag to the back of the phone…' : state === 'done' ? 'Written' : `Write ${current.code}`}
            </button>
            {state === 'error' && <p className="mt-2 text-sm text-red-400">{message}</p>}
            <div className="mt-3 flex justify-between">
              <button type="button" disabled={i === 0} onClick={() => { abort.current?.abort(); setState('idle'); setI(i - 1) }}
                      className="flex items-center gap-1 text-sm text-gray-400 disabled:opacity-30"><ChevronLeft size={15} /> Back</button>
              <button type="button" disabled={i >= codes.length - 1} onClick={() => { abort.current?.abort(); setState('idle'); setI(i + 1) }}
                      className="flex items-center gap-1 text-sm text-gray-400 disabled:opacity-30">Skip <SkipForward size={15} /></button>
            </div>
            <div className="mt-5 space-y-2 border-t border-gray-800 pt-4 text-sm text-gray-300">
              <label className="flex items-start gap-2">
                <input type="checkbox" className="mt-0.5" checked={lock} onChange={(e) => setLock(e.target.checked)} />
                <span><Lock size={13} className="-mt-0.5 mr-1 inline" />Lock each tag after writing, so nobody can rewrite it to another link. Permanent, and fine: the link never changes.</span>
              </label>
              <label className="flex items-start gap-2">
                <input type="checkbox" className="mt-0.5" checked={overwrite} onChange={(e) => setOverwrite(e.target.checked)} />
                <span>Allow overwriting tags that already hold data</span>
              </label>
            </div>
            <p className="mt-4 text-xs text-gray-500">{written.size} of {codes.length} written in this session.</p>
          </>
        )}
      </div>
    </div>
  )
}

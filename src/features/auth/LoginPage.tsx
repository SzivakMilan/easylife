import { useState } from 'react'
import { z } from 'zod'
import { useAuth } from './AuthContext'

const emailSchema = z.email('Adj meg egy érvényes e-mail címet')

export function LoginPage() {
  const { signInWithEmail, signInWithPasskey, passkeySupported } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [passkeyBusy, setPasskeyBusy] = useState(false)
  const [passkeyError, setPasskeyError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result = emailSchema.safeParse(email)
    if (!result.success) {
      setError(result.error.issues[0].message)
      return
    }
    setError(null)
    setStatus('sending')
    const { error: sendError } = await signInWithEmail(result.data)
    if (sendError) {
      setError(sendError)
      setStatus('idle')
      return
    }
    setStatus('sent')
  }

  async function handlePasskey() {
    setPasskeyError(null)
    setPasskeyBusy(true)
    const { error } = await signInWithPasskey()
    setPasskeyBusy(false)
    if (error) setPasskeyError(error)
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-center text-[28px] font-bold tracking-tight text-white">Otthon</h1>
        <p className="mt-2 text-center text-[15px] text-white/60">
          Jelentkezz be e-mail címmel, belépő linket küldünk.
        </p>

        {status === 'sent' ? (
          <div className="mt-6 rounded-card border border-white/10 bg-white/5 px-5 py-6 text-center">
            <p className="text-[16px] font-semibold text-white">Nézd meg az e-mailed</p>
            <p className="mt-1 text-[14px] text-white/60">
              Küldtünk egy belépő linket ide: <span className="text-white">{email}</span>
            </p>
          </div>
        ) : (
          <>
            {passkeySupported && (
              <div className="mt-6 flex flex-col gap-2">
                <button
                  onClick={handlePasskey}
                  disabled={passkeyBusy}
                  className="flex items-center justify-center gap-2 rounded-pill bg-white px-4 py-3 text-[15px] font-semibold text-black disabled:opacity-50"
                >
                  <FaceIdIcon />
                  {passkeyBusy ? 'Folyamatban...' : 'Belépés Face ID / Touch ID-val'}
                </button>
                {passkeyError && <p className="text-[13px] text-red-400">{passkeyError}</p>}
                <div className="my-1 flex items-center gap-3 text-[13px] text-white/35">
                  <span className="h-px flex-1 bg-white/10" />
                  vagy
                  <span className="h-px flex-1 bg-white/10" />
                </div>
              </div>
            )}
            <form onSubmit={handleSubmit} className={`flex flex-col gap-3 ${passkeySupported ? '' : 'mt-6'}`}>
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="te@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-[16px] text-white placeholder:text-white/35 focus:outline-none"
              />
              {error && <p className="text-[14px] text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={status === 'sending'}
                className="rounded-pill border border-white/20 bg-white/5 px-4 py-3 text-[15px] font-semibold text-white active:bg-white/10 disabled:opacity-50"
              >
                {status === 'sending' ? 'Küldés...' : 'Belépő link küldése'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

function FaceIdIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M4 8V6a2 2 0 0 1 2-2h2" />
      <path d="M4 16v2a2 2 0 0 0 2 2h2" />
      <path d="M20 8V6a2 2 0 0 0-2-2h-2" />
      <path d="M20 16v2a2 2 0 0 1-2 2h-2" />
      <path d="M9 10v1" />
      <path d="M15 10v1" />
      <path d="M9 15.5c.8.7 1.9 1 3 1s2.2-.3 3-1" />
      <path d="M12 9.5v3.5h-1" />
    </svg>
  )
}

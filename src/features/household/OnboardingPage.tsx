import { useState } from 'react'
import { z } from 'zod'
import { useAuth } from '../auth/AuthContext'
import { useHousehold } from './HouseholdContext'

const AVATAR_COLORS = ['#f472b6', '#60a5fa', '#fbbf24', '#34d399', '#a78bfa', '#fb7185']

const nameSchema = z.string().trim().min(1, 'Kötelező mező')

type Mode = 'choice' | 'create' | 'join'

export function OnboardingPage() {
  const { signOut } = useAuth()
  const { createHousehold, joinHousehold, household, setAddingHousehold } = useHousehold()
  // Meglévő háztartás mellé adunk hozzá egy újat (a menüből indítva)
  const isAdding = household !== null
  const [mode, setMode] = useState<Mode>('choice')
  const [displayName, setDisplayName] = useState('')
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0])
  const [householdName, setHouseholdName] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const name = nameSchema.safeParse(householdName)
    const display = nameSchema.safeParse(displayName)
    if (!name.success || !display.success) {
      setError('Add meg a háztartás nevét és a saját neved is')
      return
    }
    setBusy(true)
    const { error: err } = await createHousehold(name.data, display.data, avatarColor)
    setBusy(false)
    if (err) setError(err)
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    const display = nameSchema.safeParse(displayName)
    const codeResult = nameSchema.safeParse(code)
    if (!display.success || !codeResult.success) {
      setError('Add meg a meghívó kódot és a saját neved is')
      return
    }
    setBusy(true)
    const { error: err } = await joinHousehold(codeResult.data, display.data, avatarColor)
    setBusy(false)
    if (err) setError(err)
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-center text-[24px] font-bold tracking-tight text-white">
          {isAdding ? 'Háztartás hozzáadása' : 'Üdv az Otthonban!'}
        </h1>
        {isAdding && (
          <p className="mt-2 text-center text-[14px] text-white/55">
            Hozz létre egy újat, vagy csatlakozz egy meglévőhöz meghívó kóddal. A háztartások között a jobb felső
            menüben válthatsz.
          </p>
        )}

        {mode === 'choice' && (
          <div className="mt-6 flex flex-col gap-2">
            <button
              onClick={() => setMode('create')}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-left text-[16px] font-semibold text-white active:bg-white/10"
            >
              Új háztartás létrehozása
            </button>
            <button
              onClick={() => setMode('join')}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-left text-[16px] font-semibold text-white active:bg-white/10"
            >
              Csatlakozás meghívó kóddal
            </button>
            {isAdding ? (
              <button
                onClick={() => setAddingHousehold(false)}
                className="mt-4 text-center text-[14px] font-medium text-white/50"
              >
                Mégse
              </button>
            ) : (
              <button onClick={signOut} className="mt-4 text-center text-[14px] font-medium text-white/40">
                Kijelentkezés
              </button>
            )}
          </div>
        )}

        {mode !== 'choice' && (
          <form onSubmit={mode === 'create' ? handleCreate : handleJoin} className="mt-6 flex flex-col gap-3">
            {mode === 'create' && (
              <input
                placeholder="Háztartás neve (pl. Kovács család)"
                value={householdName}
                onChange={(e) => setHouseholdName(e.target.value)}
                className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-[16px] text-white placeholder:text-white/35 focus:outline-none"
              />
            )}
            {mode === 'join' && (
              <input
                placeholder="Meghívó kód"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-[16px] uppercase tracking-widest text-white placeholder:text-white/35 focus:outline-none"
              />
            )}
            <input
              placeholder="A te neved"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-[16px] text-white placeholder:text-white/35 focus:outline-none"
            />
            <div className="flex items-center gap-2 px-1">
              {AVATAR_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setAvatarColor(c)}
                  className="h-8 w-8 rounded-full ring-2 ring-offset-2 ring-offset-[#050505]"
                  style={{ backgroundColor: c, ringColor: avatarColor === c ? c : 'transparent' } as never}
                />
              ))}
            </div>
            {error && <p className="text-[14px] text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="rounded-pill bg-[var(--accent)] px-4 py-3 text-[15px] font-semibold text-black disabled:opacity-50"
            >
              {busy ? 'Folyamatban...' : mode === 'create' ? 'Háztartás létrehozása' : 'Csatlakozás'}
            </button>
            <button type="button" onClick={() => setMode('choice')} className="text-[14px] font-medium text-white/50">
              Vissza
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

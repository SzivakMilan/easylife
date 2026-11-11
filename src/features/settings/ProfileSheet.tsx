import { useState } from 'react'
import { BottomSheet } from '../../components/ui/BottomSheet'
import { useHousehold } from '../household/HouseholdContext'

const AVATAR_COLORS = ['#f472b6', '#60a5fa', '#fbbf24', '#34d399', '#a78bfa', '#fb7185']

interface ProfileSheetProps {
  open: boolean
  onClose: () => void
}

export function ProfileSheet({ open, onClose }: ProfileSheetProps) {
  const { myMember, updateMyMember } = useHousehold()
  const [displayName, setDisplayName] = useState(myMember?.displayName ?? '')
  const [avatarColor, setAvatarColor] = useState(myMember?.avatarColor ?? AVATAR_COLORS[0])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!displayName.trim()) {
      setError('Add meg a neved')
      return
    }
    setError(null)
    setBusy(true)
    const { error: err } = await updateMyMember(displayName.trim(), avatarColor)
    setBusy(false)
    if (err) {
      setError(err)
      return
    }
    onClose()
  }

  return (
    <BottomSheet open={open} onClose={onClose}>
      <h2 className="mb-4 text-center text-[17px] font-bold text-white">Profil</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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
          className="mt-1 rounded-pill bg-white px-4 py-3 text-[15px] font-semibold text-black disabled:opacity-50"
        >
          {busy ? 'Mentés...' : 'Mentés'}
        </button>
      </form>
    </BottomSheet>
  )
}

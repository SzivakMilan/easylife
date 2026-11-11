import { useState } from 'react'
import { BottomSheet } from '../../components/ui/BottomSheet'
import { useHousehold } from '../household/HouseholdContext'

interface HouseholdSheetProps {
  open: boolean
  onClose: () => void
}

export function HouseholdSheet({ open, onClose }: HouseholdSheetProps) {
  const { household, updateHouseholdName } = useHousehold()
  const [name, setName] = useState(household?.name ?? '')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Add meg a háztartás nevét')
      return
    }
    setError(null)
    setBusy(true)
    const { error: err } = await updateHouseholdName(name.trim())
    setBusy(false)
    if (err) {
      setError(err)
      return
    }
    onClose()
  }

  return (
    <BottomSheet open={open} onClose={onClose}>
      <h2 className="mb-4 text-center text-[17px] font-bold text-white">Háztartás</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          placeholder="Háztartás neve"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-[16px] text-white placeholder:text-white/35 focus:outline-none"
        />
        {error && <p className="text-[14px] text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="mt-1 rounded-pill bg-[var(--accent)] px-4 py-3 text-[15px] font-semibold text-black disabled:opacity-50"
        >
          {busy ? 'Mentés...' : 'Mentés'}
        </button>
      </form>
    </BottomSheet>
  )
}

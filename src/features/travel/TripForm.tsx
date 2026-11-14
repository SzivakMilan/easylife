import { useState } from 'react'
import { z } from 'zod'
import { format } from 'date-fns'
import { useHousehold } from '../household/HouseholdContext'
import type { TripInput } from '../../lib/api/trips'
import type { Trip } from '../../types'

const schema = z.object({
  name: z.string().trim().min(1, 'Add meg az utazás nevét'),
  startDate: z.string().min(1, 'Add meg a kezdő dátumot'),
})

interface TripFormProps {
  initial?: Trip
  onSubmit: (input: TripInput) => Promise<void>
  onCancel: () => void
  submitLabel?: string
}

export function TripForm({ initial, onSubmit, onCancel, submitLabel }: TripFormProps) {
  const { members } = useHousehold()
  const [name, setName] = useState(initial?.name ?? '')
  const [destination, setDestination] = useState(initial?.destination ?? '')
  const [startDate, setStartDate] = useState(() => initial?.startDate ?? format(new Date(), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(initial?.endDate ?? '')
  const [note, setNote] = useState(initial?.note ?? '')
  const [participantIds, setParticipantIds] = useState<string[]>(initial?.participantIds ?? [])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  function toggleParticipant(id: string) {
    setParticipantIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result = schema.safeParse({ name, startDate })
    if (!result.success) {
      setError(result.error.issues[0].message)
      return
    }
    setError(null)
    setBusy(true)
    try {
      await onSubmit({
        name: result.data.name,
        destination: destination.trim() || undefined,
        startDate: result.data.startDate,
        endDate: endDate || undefined,
        note: note.trim() || undefined,
        participantIds,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ismeretlen hiba történt')
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input
        placeholder="Utazás neve (pl. Nyári nyaralás)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-[16px] text-white placeholder:text-white/35 focus:outline-none"
      />
      <input
        placeholder="Úti cél (pl. Pécs, Magyarország)"
        value={destination}
        onChange={(e) => setDestination(e.target.value)}
        className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-[16px] text-white placeholder:text-white/35 focus:outline-none"
      />
      <div className="flex gap-2">
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="flex-1 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-[16px] text-white focus:outline-none [color-scheme:dark]"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="flex-1 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-[16px] text-white focus:outline-none [color-scheme:dark]"
        />
      </div>
      <textarea
        placeholder="Jegyzet (opcionális)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-[15px] text-white placeholder:text-white/35 focus:outline-none"
      />

      <div>
        <p className="mb-1.5 text-[13px] font-medium text-white/50">Résztvevők</p>
        <div className="flex flex-wrap gap-2">
          {members.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => toggleParticipant(m.id)}
              className={`rounded-pill border px-3 py-1.5 text-[13px] font-medium ${
                participantIds.includes(m.id)
                  ? 'border-[var(--accent)] bg-[var(--accent)] text-black'
                  : 'border-white/15 bg-white/5 text-white/80'
              }`}
            >
              {m.displayName}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-[14px] text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="mt-1 rounded-pill bg-[var(--accent)] px-4 py-3 text-[15px] font-semibold text-black disabled:opacity-50"
      >
        {busy ? 'Mentés...' : (submitLabel ?? 'Mentés')}
      </button>
      <button type="button" onClick={onCancel} className="text-[14px] font-medium text-white/50">
        Mégse
      </button>
    </form>
  )
}

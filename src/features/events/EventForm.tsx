import { useState } from 'react'
import { z } from 'zod'
import { format } from 'date-fns'
import { useHousehold } from '../household/HouseholdContext'
import { ReminderPicker } from '../../components/ui/ReminderPicker'
import type { EventInput } from '../../lib/api/events'
import type { EventItem } from '../../types'

const schema = z.object({
  title: z.string().trim().min(1, 'Add meg a címet'),
  date: z.string().min(1, 'Add meg a dátumot'),
  startTime: z.string().min(1, 'Add meg a kezdés időpontját'),
})

interface EventFormProps {
  initial?: EventItem
  onSubmit: (input: EventInput) => Promise<void>
  onCancel: () => void
  submitLabel?: string
}

export function EventForm({ initial, onSubmit, onCancel, submitLabel }: EventFormProps) {
  const { members, connectedMembers } = useHousehold()
  const [title, setTitle] = useState(initial?.title ?? '')
  const [date, setDate] = useState(() =>
    format(initial ? new Date(initial.startAt) : new Date(), 'yyyy-MM-dd'),
  )
  const [startTime, setStartTime] = useState(() => (initial ? format(new Date(initial.startAt), 'HH:mm') : ''))
  const [endTime, setEndTime] = useState(() => (initial?.endAt ? format(new Date(initial.endAt), 'HH:mm') : ''))
  const [location, setLocation] = useState(initial?.location ?? '')
  const [note, setNote] = useState(initial?.note ?? '')
  const [reminders, setReminders] = useState<number[]>(initial?.reminderOffsets ?? [])
  const [participantIds, setParticipantIds] = useState<string[]>(initial?.participantIds ?? [])
  const [viewerIds, setViewerIds] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const extraMembers = connectedMembers.filter((m) => !m.isOwnHousehold)

  function toggle(list: string[], setList: (v: string[]) => void, id: string) {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result = schema.safeParse({ title, date, startTime })
    if (!result.success) {
      setError(result.error.issues[0].message)
      return
    }
    setError(null)
    setBusy(true)
    try {
      await onSubmit({
        title: result.data.title,
        startAt: new Date(`${result.data.date}T${result.data.startTime}:00`).toISOString(),
        endAt: endTime ? new Date(`${result.data.date}T${endTime}:00`).toISOString() : undefined,
        location: location.trim() || undefined,
        note: note.trim() || undefined,
        reminderOffsets: reminders,
        participantIds,
        viewerIds,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ismeretlen hiba történt')
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input
        placeholder="Cím"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-[16px] text-white placeholder:text-white/35 focus:outline-none"
      />
      <div className="flex gap-2">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="flex-1 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-[16px] text-white focus:outline-none [color-scheme:dark]"
        />
        <input
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          className="flex-1 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-[16px] text-white focus:outline-none [color-scheme:dark]"
        />
        <input
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          placeholder="Vége"
          className="flex-1 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-[16px] text-white focus:outline-none [color-scheme:dark]"
        />
      </div>
      <input
        placeholder="Helyszín (opcionális)"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-[15px] text-white placeholder:text-white/35 focus:outline-none"
      />
      <textarea
        placeholder="Megjegyzés (opcionális)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-[15px] text-white placeholder:text-white/35 focus:outline-none"
      />
      <ReminderPicker value={reminders} onChange={setReminders} />

      <div>
        <p className="mb-1.5 text-[13px] font-medium text-white/50">Résztvevők</p>
        <div className="flex flex-wrap gap-2">
          {members.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => toggle(participantIds, setParticipantIds, m.id)}
              className={`rounded-pill border px-3 py-1.5 text-[13px] font-medium ${
                participantIds.includes(m.id)
                  ? 'border-white bg-white text-black'
                  : 'border-white/15 bg-white/5 text-white/80'
              }`}
            >
              {m.displayName}
            </button>
          ))}
        </div>
      </div>

      {extraMembers.length > 0 && (
        <div>
          <p className="mb-1.5 text-[13px] font-medium text-white/50">Ki lássa még?</p>
          <div className="flex flex-wrap gap-2">
            {extraMembers.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => toggle(viewerIds, setViewerIds, m.id)}
                className={`rounded-pill border px-3 py-1.5 text-[13px] font-medium ${
                  viewerIds.includes(m.id)
                    ? 'border-white bg-white text-black'
                    : 'border-white/15 bg-white/5 text-white/80'
                }`}
              >
                {m.displayName} ({m.householdName})
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-[14px] text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="mt-1 rounded-pill bg-white px-4 py-3 text-[15px] font-semibold text-black disabled:opacity-50"
      >
        {busy ? 'Mentés...' : (submitLabel ?? 'Mentés')}
      </button>
      <button type="button" onClick={onCancel} className="text-[14px] font-medium text-white/50">
        Mégse
      </button>
    </form>
  )
}

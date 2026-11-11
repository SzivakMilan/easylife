import { useState } from 'react'
import { z } from 'zod'
import { format } from 'date-fns'
import { useHousehold } from '../household/HouseholdContext'
import type { DeadlineInput } from '../../lib/api/deadlines'
import type { Deadline, Priority, Recurrence } from '../../types'

const schema = z.object({
  title: z.string().trim().min(1, 'Add meg a címet'),
  dueDate: z.string().min(1, 'Add meg a határidő dátumát'),
})

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: 'low', label: 'Alacsony' },
  { value: 'medium', label: 'Közepes' },
  { value: 'high', label: 'Magas' },
]

const RECURRENCE_OPTIONS: { value: Recurrence; label: string }[] = [
  { value: 'none', label: 'Nincs' },
  { value: 'weekly', label: 'Heti' },
  { value: 'monthly', label: 'Havi' },
  { value: 'yearly', label: 'Éves' },
]

interface DeadlineFormProps {
  initial?: Deadline
  onSubmit: (input: DeadlineInput) => Promise<void>
  onCancel: () => void
  submitLabel?: string
}

export function DeadlineForm({ initial, onSubmit, onCancel, submitLabel }: DeadlineFormProps) {
  const { members, connectedMembers } = useHousehold()
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [dueDate, setDueDate] = useState(() => initial?.dueDate ?? format(new Date(), 'yyyy-MM-dd'))
  const [dueTime, setDueTime] = useState(initial?.dueTime ?? '')
  const [priority, setPriority] = useState<Priority>(initial?.priority ?? 'medium')
  const [recurrence, setRecurrence] = useState<Recurrence>(initial?.recurrence ?? 'none')
  const [assigneeIds, setAssigneeIds] = useState<string[]>(initial?.assigneeIds ?? [])
  const [viewerIds, setViewerIds] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const extraMembers = connectedMembers.filter((m) => !m.isOwnHousehold)

  function toggle(list: string[], setList: (v: string[]) => void, id: string) {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result = schema.safeParse({ title, dueDate })
    if (!result.success) {
      setError(result.error.issues[0].message)
      return
    }
    setError(null)
    setBusy(true)
    try {
      await onSubmit({
        title: result.data.title,
        description: description.trim() || undefined,
        dueDate: result.data.dueDate,
        dueTime: dueTime || undefined,
        priority,
        recurrence,
        assigneeIds,
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
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="flex-1 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-[16px] text-white focus:outline-none [color-scheme:dark]"
        />
        <input
          type="time"
          value={dueTime}
          onChange={(e) => setDueTime(e.target.value)}
          className="flex-1 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-[16px] text-white focus:outline-none [color-scheme:dark]"
        />
      </div>
      <textarea
        placeholder="Leírás (opcionális)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-[15px] text-white placeholder:text-white/35 focus:outline-none"
      />

      <div className="flex gap-2">
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as Priority)}
          className="flex-1 rounded-2xl border border-white/15 bg-white/5 px-3 py-3 text-[14px] text-white focus:outline-none [color-scheme:dark]"
        >
          {PRIORITY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label} prioritás
            </option>
          ))}
        </select>
        <select
          value={recurrence}
          onChange={(e) => setRecurrence(e.target.value as Recurrence)}
          className="flex-1 rounded-2xl border border-white/15 bg-white/5 px-3 py-3 text-[14px] text-white focus:outline-none [color-scheme:dark]"
        >
          {RECURRENCE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              Ismétlődés: {o.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <p className="mb-1.5 text-[13px] font-medium text-white/50">Felelős(ök)</p>
        <div className="flex flex-wrap gap-2">
          {members.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => toggle(assigneeIds, setAssigneeIds, m.id)}
              className={`rounded-pill border px-3 py-1.5 text-[13px] font-medium ${
                assigneeIds.includes(m.id)
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

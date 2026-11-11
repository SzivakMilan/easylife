import { useState } from 'react'
import { z } from 'zod'
import { format } from 'date-fns'
import { SectionIcon } from '../../components/ui/icons'
import { useBudget } from '../budget/BudgetContext'
import { useHousehold } from '../household/HouseholdContext'
import { ReminderPicker } from '../../components/ui/ReminderPicker'
import { uploadBillFile } from '../../lib/api/bills'
import type { BillInput } from '../../lib/api/bills'
import type { Bill, Recurrence } from '../../types'

const schema = z.object({
  issuer: z.string().trim().min(1, 'Add meg a kibocsátót'),
  amount: z.coerce.number().positive('Add meg az összeget'),
  dueDate: z.string().min(1, 'Add meg az esedékességet'),
  categoryId: z.string().min(1, 'Válassz kategóriát'),
})

const RECURRENCE_OPTIONS: { value: Recurrence; label: string }[] = [
  { value: 'none', label: 'Nincs ismétlődés' },
  { value: 'weekly', label: 'Heti ismétlődés' },
  { value: 'monthly', label: 'Havi ismétlődés' },
  { value: 'yearly', label: 'Éves ismétlődés' },
]

interface BillFormProps {
  initial?: Bill
  onSubmit: (input: BillInput) => Promise<void>
  onCancel: () => void
  submitLabel?: string
}

export function BillForm({ initial, onSubmit, onCancel, submitLabel }: BillFormProps) {
  const { categories } = useBudget()
  const { household, connectedMembers } = useHousehold()
  const [issuer, setIssuer] = useState(initial?.issuer ?? '')
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '')
  const [dueDate, setDueDate] = useState(() => initial?.dueDate ?? format(new Date(), 'yyyy-MM-dd'))
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? categories[0]?.id ?? '')
  const [recurrence, setRecurrence] = useState<Recurrence>(initial?.recurrence ?? 'none')
  const [reminders, setReminders] = useState<number[]>(initial ? initial.reminderOffsets : [1440])
  const [file, setFile] = useState<File | null>(null)
  const [viewerIds, setViewerIds] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const extraMembers = connectedMembers.filter((m) => !m.isOwnHousehold)

  function toggleViewer(id: string) {
    setViewerIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result = schema.safeParse({ issuer, amount, dueDate, categoryId })
    if (!result.success) {
      setError(result.error.issues[0].message)
      return
    }
    if (!household) {
      setError('Nincs háztartásod')
      return
    }
    setError(null)
    setBusy(true)
    try {
      let filePath = initial?.filePath
      if (file) {
        filePath = await uploadBillFile(household.id, file)
      }
      await onSubmit({
        issuer: result.data.issuer,
        amount: result.data.amount,
        dueDate: result.data.dueDate,
        categoryId: result.data.categoryId,
        recurrence,
        reminderOffsets: reminders,
        filePath,
        viewerIds,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ismeretlen hiba történt')
      setBusy(false)
    }
  }

  if (categories.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-[14px] text-white/50">Először hozz létre egy költségvetési kategóriát a Költségvetés oldalon.</p>
        <button type="button" onClick={onCancel} className="text-[14px] font-medium text-white/50">
          Vissza
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input
        placeholder="Kibocsátó (pl. MVM, Telekom)"
        value={issuer}
        onChange={(e) => setIssuer(e.target.value)}
        className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-[16px] text-white placeholder:text-white/35 focus:outline-none"
      />
      <div className="flex gap-2">
        <input
          type="number"
          inputMode="numeric"
          placeholder="Összeg (Ft)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="flex-1 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-[16px] text-white placeholder:text-white/35 focus:outline-none"
        />
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="flex-1 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-[16px] text-white focus:outline-none [color-scheme:dark]"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategoryId(c.id)}
            className={`flex items-center gap-1.5 rounded-pill border px-3 py-1.5 text-[13px] font-medium ${
              categoryId === c.id ? 'border-white bg-white text-black' : 'border-white/15 bg-white/5 text-white/80'
            }`}
          >
            <SectionIcon icon={c.icon} />
            {c.name}
          </button>
        ))}
      </div>

      <select
        value={recurrence}
        onChange={(e) => setRecurrence(e.target.value as Recurrence)}
        className="rounded-2xl border border-white/15 bg-white/5 px-3 py-3 text-[14px] text-white focus:outline-none [color-scheme:dark]"
      >
        {RECURRENCE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      <ReminderPicker value={reminders} onChange={setReminders} />

      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-medium text-white/50">
          {initial?.filePath ? 'Melléklet cseréje (opcionális)' : 'Melléklet csatolása (PDF vagy fotó, opcionális)'}
        </span>
        <input
          type="file"
          accept="image/*,application/pdf"
          capture="environment"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-[14px] text-white/70 file:mr-3 file:rounded-pill file:border-0 file:bg-white/15 file:px-3 file:py-1.5 file:text-white"
        />
      </label>

      {extraMembers.length > 0 && (
        <div>
          <p className="mb-1.5 text-[13px] font-medium text-white/50">Ki lássa még?</p>
          <div className="flex flex-wrap gap-2">
            {extraMembers.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => toggleViewer(m.id)}
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

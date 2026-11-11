import { useState } from 'react'
import { z } from 'zod'
import { format } from 'date-fns'
import { SectionIcon } from '../../components/ui/icons'
import type { BudgetItemInput } from '../../lib/api/budget'
import type { BudgetCategory, BudgetItem } from '../../types'

const schema = z.object({
  categoryId: z.string().min(1, 'Válassz kategóriát'),
  amount: z.coerce.number().positive('Add meg az összeget'),
  occurredOn: z.string().min(1, 'Add meg a dátumot'),
})

interface BudgetItemFormProps {
  categories: BudgetCategory[]
  initial?: BudgetItem
  defaultType?: 'expense' | 'income'
  onSubmit: (input: BudgetItemInput) => Promise<void>
  onCancel: () => void
  submitLabel?: string
}

export function BudgetItemForm({ categories, initial, defaultType, onSubmit, onCancel, submitLabel }: BudgetItemFormProps) {
  const [type, setType] = useState<'expense' | 'income'>(initial?.type ?? defaultType ?? 'expense')
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? categories[0]?.id ?? '')
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '')
  const [note, setNote] = useState(initial?.note ?? '')
  const [occurredOn, setOccurredOn] = useState(() => initial?.occurredOn ?? format(new Date(), 'yyyy-MM-dd'))
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result = schema.safeParse({ categoryId, amount, occurredOn })
    if (!result.success) {
      setError(result.error.issues[0].message)
      return
    }
    setError(null)
    setBusy(true)
    try {
      await onSubmit({
        categoryId: result.data.categoryId,
        type,
        amount: result.data.amount,
        note: note.trim() || undefined,
        occurredOn: result.data.occurredOn,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ismeretlen hiba történt')
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setType('expense')}
          className={`flex-1 rounded-pill border px-3 py-2.5 text-[14px] font-semibold ${
            type === 'expense' ? 'border-white bg-white text-black' : 'border-white/15 bg-white/5 text-white/80'
          }`}
        >
          Kiadás
        </button>
        <button
          type="button"
          onClick={() => setType('income')}
          className={`flex-1 rounded-pill border px-3 py-2.5 text-[14px] font-semibold ${
            type === 'income' ? 'border-white bg-white text-black' : 'border-white/15 bg-white/5 text-white/80'
          }`}
        >
          Bevétel
        </button>
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

      <input
        type="number"
        inputMode="numeric"
        placeholder="Összeg (Ft)"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-[16px] text-white placeholder:text-white/35 focus:outline-none"
      />
      <input
        placeholder="Megjegyzés (opcionális)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-[15px] text-white placeholder:text-white/35 focus:outline-none"
      />
      <input
        type="date"
        value={occurredOn}
        onChange={(e) => setOccurredOn(e.target.value)}
        className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-[16px] text-white focus:outline-none [color-scheme:dark]"
      />

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

import { useState } from 'react'
import { z } from 'zod'
import { SectionIcon } from '../../components/ui/icons'
import type { CategoryInput } from '../../lib/api/budget'
import type { BudgetCategory } from '../../types'

const COLORS = ['#fb923c', '#34d399', '#60a5fa', '#a78bfa', '#fb7185', '#fbbf24', '#2dd4bf', '#f87171']
const ICONS = ['bolt', 'cart', 'car', 'baby', 'ticket', 'wallet', 'home']

const schema = z.object({
  name: z.string().trim().min(1, 'Add meg a kategória nevét'),
  monthlyLimit: z.coerce.number().min(0, 'A keret nem lehet negatív'),
})

interface CategoryFormProps {
  initial?: BudgetCategory
  onSubmit: (input: CategoryInput) => Promise<void>
  onCancel: () => void
  submitLabel?: string
}

export function CategoryForm({ initial, onSubmit, onCancel, submitLabel }: CategoryFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [color, setColor] = useState(initial?.color ?? COLORS[0])
  const [icon, setIcon] = useState(initial?.icon ?? ICONS[0])
  const [monthlyLimit, setMonthlyLimit] = useState(initial ? String(initial.monthlyLimit) : '')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result = schema.safeParse({ name, monthlyLimit })
    if (!result.success) {
      setError(result.error.issues[0].message)
      return
    }
    setError(null)
    setBusy(true)
    try {
      await onSubmit({ name: result.data.name, color, icon, monthlyLimit: result.data.monthlyLimit })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ismeretlen hiba történt')
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input
        placeholder="Kategória neve"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-[16px] text-white placeholder:text-white/35 focus:outline-none"
      />
      <input
        type="number"
        inputMode="numeric"
        placeholder="Havi keret (Ft)"
        value={monthlyLimit}
        onChange={(e) => setMonthlyLimit(e.target.value)}
        className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-[16px] text-white placeholder:text-white/35 focus:outline-none"
      />
      <div>
        <p className="mb-1.5 text-[13px] font-medium text-white/50">Szín</p>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className="h-8 w-8 rounded-full ring-2 ring-offset-2 ring-offset-[#121212]"
              style={{ backgroundColor: c, ringColor: color === c ? c : 'transparent' } as never}
            />
          ))}
        </div>
      </div>
      <div>
        <p className="mb-1.5 text-[13px] font-medium text-white/50">Ikon</p>
        <div className="flex flex-wrap gap-2">
          {ICONS.map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIcon(i)}
              className={`flex h-10 w-10 items-center justify-center rounded-full border ${
                icon === i ? 'border-white bg-white text-black' : 'border-white/15 bg-white/5 text-white/70'
              }`}
            >
              <SectionIcon icon={i} />
            </button>
          ))}
        </div>
      </div>
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

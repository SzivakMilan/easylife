import { useRef, useState } from 'react'
import { format } from 'date-fns'
import { z } from 'zod'
import { BottomSheet } from '../../components/ui/BottomSheet'
import { formatHUF } from '../../lib/currency'
import { formatFullDate, parseDate } from '../../lib/dateUtils'
import { SectionIcon } from '../../components/ui/icons'
import { useBudget } from './BudgetContext'
import { GoalForm } from './GoalForm'
import type { SavingsGoal } from '../../types'

interface GoalDetailSheetProps {
  goal: SavingsGoal | null
  onClose: () => void
}

type Mode = 'view' | 'edit-goal' | 'add-contribution'

const contributionSchema = z.object({
  amount: z.coerce.number().positive('Add meg az összeget'),
  occurredOn: z.string().min(1, 'Add meg a dátumot'),
})

export function GoalDetailSheet({ goal, onClose }: GoalDetailSheetProps) {
  const { savingsGoals, savingsContributions, updateGoal, deleteGoal, addContribution, deleteContribution } =
    useBudget()
  const [mode, setMode] = useState<Mode>('view')
  const lastRef = useRef<SavingsGoal | null>(goal)
  if (goal) lastRef.current = goal
  const displayGoal = goal ?? lastRef.current

  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [occurredOn, setOccurredOn] = useState(() => format(new Date(), 'yyyy-MM-dd'))
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  function handleClose() {
    setMode('view')
    setAmount('')
    setNote('')
    onClose()
  }

  const live = displayGoal ? savingsGoals.find((g) => g.id === displayGoal.id) ?? displayGoal : null

  const gradient = live
    ? `linear-gradient(170deg, color-mix(in srgb, ${live.color} 55%, #0a0a0c) 0%, #0a0a0c 65%)`
    : undefined

  const contributions = live ? savingsContributions.filter((c) => c.goalId === live.id) : []
  const saved = contributions.reduce((sum, c) => sum + c.amount, 0)
  const remaining = live ? Math.max(live.targetAmount - saved, 0) : 0
  const percent = live && live.targetAmount > 0 ? Math.min(Math.round((saved / live.targetAmount) * 100), 100) : 0
  const sorted = [...contributions].sort((a, b) => b.occurredOn.localeCompare(a.occurredOn))

  async function handleAddContribution(e: React.FormEvent) {
    e.preventDefault()
    if (!live) return
    const result = contributionSchema.safeParse({ amount, occurredOn })
    if (!result.success) {
      setError(result.error.issues[0].message)
      return
    }
    setError(null)
    setBusy(true)
    try {
      await addContribution({
        goalId: live.id,
        amount: result.data.amount,
        note: note.trim() || undefined,
        occurredOn: result.data.occurredOn,
      })
      setAmount('')
      setNote('')
      setMode('view')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ismeretlen hiba történt')
    }
    setBusy(false)
  }

  return (
    <BottomSheet open={Boolean(goal)} onClose={handleClose} gradient={gradient}>
      {live && mode === 'edit-goal' && (
        <div>
          <h2 className="mb-4 text-center text-[17px] font-bold text-white">Cél szerkesztése</h2>
          <GoalForm
            initial={live}
            submitLabel="Mentés"
            onCancel={() => setMode('view')}
            onSubmit={async (input) => {
              await updateGoal(live.id, input)
              setMode('view')
            }}
          />
          <button
            onClick={async () => {
              await deleteGoal(live.id)
              handleClose()
            }}
            className="mt-2 w-full text-center text-[14px] font-medium text-red-400"
          >
            Cél törlése
          </button>
        </div>
      )}

      {live && mode === 'add-contribution' && (
        <form onSubmit={handleAddContribution} className="flex flex-col gap-3">
          <h2 className="mb-1 text-center text-[17px] font-bold text-white">Félretett összeg hozzáadása</h2>
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
            {busy ? 'Mentés...' : 'Hozzáadás'}
          </button>
          <button type="button" onClick={() => setMode('view')} className="text-[14px] font-medium text-white/50">
            Mégse
          </button>
        </form>
      )}

      {live && mode === 'view' && (
        <div className="flex flex-col gap-5">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full"
                  style={{ backgroundColor: `color-mix(in srgb, ${live.color} 28%, transparent)`, color: live.color }}
                >
                  <SectionIcon icon={live.icon} />
                </span>
                <h2 className="text-[20px] font-bold text-white">{live.name}</h2>
              </div>
              <button onClick={() => setMode('edit-goal')} className="text-[14px] font-medium text-white/60">
                Szerkesztés
              </button>
            </div>
            <div className="mt-4 grid grid-cols-3 divide-x divide-white/10 text-center">
              <Stat label="Cél" value={formatHUF(live.targetAmount)} />
              <Stat label="Félretéve" value={formatHUF(saved)} />
              <Stat label="Hátralévő" value={formatHUF(remaining)} />
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full"
                style={{ width: `${percent}%`, backgroundColor: live.color }}
              />
            </div>
            <p className="mt-1.5 text-right text-[13px] text-white/50">{percent}%</p>
          </div>

          <button
            onClick={() => setMode('add-contribution')}
            className="rounded-pill border border-white/15 bg-white/5 px-4 py-3 text-[15px] font-semibold text-white active:bg-white/10"
          >
            + Félretett összeg hozzáadása
          </button>

          <div>
            <h3 className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-wide text-white/40">Előzmények</h3>
            {sorted.length === 0 ? (
              <div className="rounded-card border border-white/10 bg-black/20 px-4 py-8 text-center text-[15px] text-white/60">
                Még nincs félretett összeg
              </div>
            ) : (
              <div className="overflow-hidden rounded-card border border-white/10 bg-black/20">
                {sorted.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between gap-3 border-t border-white/8 px-4 py-3 first:border-t-0"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[15px] font-medium text-white">{c.note ?? 'Félretéve'}</span>
                      <span className="block text-[13px] text-white/45">{formatFullDate(parseDate(c.occurredOn))}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-3">
                      <span className="text-emerald-400">+{formatHUF(c.amount)}</span>
                      <button
                        onClick={() => deleteContribution(c.id)}
                        aria-label="Törlés"
                        className="text-white/30 active:text-red-400"
                      >
                        ✕
                      </button>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </BottomSheet>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-2">
      <p className="text-[12px] font-medium text-white/45">{label}</p>
      <p className="mt-0.5 text-[15px] font-bold text-white">{value}</p>
    </div>
  )
}

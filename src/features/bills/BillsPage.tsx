import { useMemo, useState } from 'react'
import { Card } from '../../components/ui/Card'
import { AgendaGroupedList } from '../home/AgendaGroupedList'
import { ItemDetailSheet } from '../home/ItemDetailSheet'
import { billAgendaItems } from '../../lib/agenda'
import { formatHUF } from '../../lib/currency'
import { useBudget } from '../budget/BudgetContext'
import { useBills } from './BillsContext'
import type { AgendaItem, Bill, Recurrence } from '../../types'

const RECURRENCE_LABEL: Record<Recurrence, string> = {
  none: '',
  weekly: '/hét',
  monthly: '/hó',
  yearly: '/év',
}

/** Heti/havi/éves ismétlődést egységesen havi szintre vetít, hogy összehasonlítható/összegezhető legyen. */
function monthlyEquivalent(bill: Bill): number {
  if (bill.recurrence === 'weekly') return bill.amount * (52 / 12)
  if (bill.recurrence === 'yearly') return bill.amount / 12
  return bill.amount
}

export function BillsPage() {
  const [selected, setSelected] = useState<AgendaItem | null>(null)
  const { bills, loading } = useBills()
  const { categories } = useBudget()
  const pending = useMemo(() => billAgendaItems(bills.filter((b) => b.status === 'pending'), categories), [bills, categories])
  const paid = useMemo(() => billAgendaItems(bills.filter((b) => b.status === 'paid'), categories), [bills, categories])
  const subscriptions = useMemo(
    () => bills.filter((b) => b.recurrence !== 'none' && b.status === 'pending'),
    [bills],
  )
  const monthlyTotal = useMemo(() => subscriptions.reduce((sum, b) => sum + monthlyEquivalent(b), 0), [subscriptions])

  return (
    <div className="flex flex-col gap-4 px-4 pb-28 pt-2">
      <h2 className="px-1 text-[20px] font-bold text-white">Számlák</h2>

      {subscriptions.length > 0 && (
        <div>
          <h3 className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-wide text-white/40">
            Előfizetések · {formatHUF(monthlyTotal)}/hó
          </h3>
          <Card className="overflow-hidden">
            {subscriptions.map((b) => (
              <div key={b.id} className="flex items-center justify-between border-t border-white/8 px-4 py-3 first:border-t-0">
                <span className="text-[15px] font-medium text-white">{b.issuer}</span>
                <span className="text-[14px] text-white/60">
                  {formatHUF(b.amount)}
                  {RECURRENCE_LABEL[b.recurrence]}
                </span>
              </div>
            ))}
          </Card>
        </div>
      )}

      <div>
        <h3 className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-wide text-white/40">Fizetendő</h3>
        <Card className="pt-2">
          <AgendaGroupedList
            items={pending}
            emptyLabel={loading ? 'Betöltés...' : 'Nincs fizetendő számla'}
            onSelect={setSelected}
          />
        </Card>
      </div>
      <div>
        <h3 className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-wide text-white/40">Befizetve</h3>
        <Card className="pt-2">
          <AgendaGroupedList items={paid} emptyLabel="Még nincs befizetett számla" onSelect={setSelected} />
        </Card>
      </div>
      <ItemDetailSheet item={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

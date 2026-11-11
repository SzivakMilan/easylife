import { useMemo, useState } from 'react'
import { Card } from '../../components/ui/Card'
import { AgendaGroupedList } from '../home/AgendaGroupedList'
import { ItemDetailSheet } from '../home/ItemDetailSheet'
import { billAgendaItems } from '../../lib/agenda'
import { useBudget } from '../budget/BudgetContext'
import { useBills } from './BillsContext'
import type { AgendaItem } from '../../types'

export function BillsPage() {
  const [selected, setSelected] = useState<AgendaItem | null>(null)
  const { bills, loading } = useBills()
  const { categories } = useBudget()
  const pending = useMemo(() => billAgendaItems(bills.filter((b) => b.status === 'pending'), categories), [bills, categories])
  const paid = useMemo(() => billAgendaItems(bills.filter((b) => b.status === 'paid'), categories), [bills, categories])

  return (
    <div className="flex flex-col gap-4 px-4 pb-28 pt-2">
      <h2 className="px-1 text-[20px] font-bold text-white">Számlák</h2>
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

import { useMemo, useState } from 'react'
import { Card } from '../../components/ui/Card'
import { SegmentedControl } from '../../components/ui/SegmentedControl'
import { deadlineAgendaItems, eventAgendaItems, billAgendaItems } from '../../lib/agenda'
import { isToday, isWithinNextDays, isYesterday, parseDate } from '../../lib/dateUtils'
import { useDeadlines } from '../deadlines/DeadlinesContext'
import { useEvents } from '../events/EventsContext'
import { useBudget } from '../budget/BudgetContext'
import { useBills } from '../bills/BillsContext'
import type { AgendaItem } from '../../types'
import { AgendaGroupedList } from './AgendaGroupedList'
import { ItemDetailSheet } from './ItemDetailSheet'

type Tab = 'yesterday' | 'today' | 'upcoming'

const TABS: { key: Tab; label: string }[] = [
  { key: 'yesterday', label: 'Tegnap' },
  { key: 'today', label: 'Ma' },
  { key: 'upcoming', label: 'Közelgő\nesemények' },
]

export function HomePage() {
  const [tab, setTab] = useState<Tab>('today')
  const [selected, setSelected] = useState<AgendaItem | null>(null)
  const { deadlines } = useDeadlines()
  const { events } = useEvents()
  const { bills } = useBills()
  const { categories } = useBudget()

  const agenda = useMemo(() => {
    const items = [
      ...deadlineAgendaItems(deadlines),
      ...eventAgendaItems(events),
      ...billAgendaItems(
        bills.filter((b) => b.status === 'pending'),
        categories,
      ),
    ]
    return items.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date)
      return (a.time ?? '').localeCompare(b.time ?? '')
    })
  }, [deadlines, events, bills, categories])

  const items = useMemo(() => {
    return agenda.filter((item) => {
      const date = parseDate(item.date)
      if (tab === 'yesterday') return isYesterday(date)
      if (tab === 'today') return isToday(date)
      return isWithinNextDays(date, 14) && !isToday(date)
    })
  }, [agenda, tab])

  const emptyLabel = tab === 'today' ? 'Ma nincs teendő' : tab === 'yesterday' ? 'Tegnap nem volt teendő' : 'Nincs közelgő esemény'

  return (
    <div className="flex flex-col gap-4 px-4 pb-28 pt-2">
      <Card className="pt-3">
        <SegmentedControl
          layoutId="home-tabs"
          value={tab}
          onChange={(key) => setTab(key as Tab)}
          segments={TABS.map((t) => ({ key: t.key, label: t.label }))}
        />
        <AgendaGroupedList items={items} emptyLabel={emptyLabel} onSelect={setSelected} />
      </Card>
      <ItemDetailSheet item={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

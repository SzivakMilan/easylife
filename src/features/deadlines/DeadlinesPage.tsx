import { useMemo, useState } from 'react'
import { Card } from '../../components/ui/Card'
import { AgendaGroupedList } from '../home/AgendaGroupedList'
import { ItemDetailSheet } from '../home/ItemDetailSheet'
import { deadlineAgendaItems } from '../../lib/agenda'
import { useDeadlines } from './DeadlinesContext'
import type { AgendaItem } from '../../types'

export function DeadlinesPage() {
  const [selected, setSelected] = useState<AgendaItem | null>(null)
  const { deadlines, loading } = useDeadlines()
  const items = useMemo(() => deadlineAgendaItems(deadlines), [deadlines])

  return (
    <div className="flex flex-col gap-4 px-4 pb-28 pt-2">
      <h2 className="px-1 text-[20px] font-bold text-white">Határidők</h2>
      <Card className="pt-2">
        <AgendaGroupedList
          items={items}
          emptyLabel={loading ? 'Betöltés...' : 'Nincs határidő'}
          onSelect={setSelected}
        />
      </Card>
      <ItemDetailSheet item={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

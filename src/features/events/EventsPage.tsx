import { useMemo, useState } from 'react'
import { Card } from '../../components/ui/Card'
import { AgendaGroupedList } from '../home/AgendaGroupedList'
import { ItemDetailSheet } from '../home/ItemDetailSheet'
import { eventAgendaItems } from '../../lib/agenda'
import { useEvents } from './EventsContext'
import type { AgendaItem } from '../../types'

export function EventsPage() {
  const [selected, setSelected] = useState<AgendaItem | null>(null)
  const { events, loading } = useEvents()
  const items = useMemo(() => eventAgendaItems(events), [events])

  return (
    <div className="flex flex-col gap-4 px-4 pb-28 pt-2">
      <h2 className="px-1 text-[20px] font-bold text-white">Időpontok</h2>
      <Card className="pt-2">
        <AgendaGroupedList items={items} emptyLabel={loading ? 'Betöltés...' : 'Nincs időpont'} onSelect={setSelected} />
      </Card>
      <ItemDetailSheet item={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

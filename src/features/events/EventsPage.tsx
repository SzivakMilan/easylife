import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { Card } from '../../components/ui/Card'
import { SegmentedControl } from '../../components/ui/SegmentedControl'
import { AgendaGroupedList } from '../home/AgendaGroupedList'
import { ItemDetailSheet } from '../home/ItemDetailSheet'
import { eventAgendaItems } from '../../lib/agenda'
import { useEvents } from './EventsContext'
import { MonthCalendar } from './MonthCalendar'
import type { AgendaItem } from '../../types'

export function EventsPage() {
  const [selected, setSelected] = useState<AgendaItem | null>(null)
  const [view, setView] = useState<'list' | 'month'>('list')
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const { events, loading } = useEvents()
  const items = useMemo(() => eventAgendaItems(events), [events])

  const dayItems = useMemo(() => {
    if (!selectedDay) return []
    const dateStr = format(selectedDay, 'yyyy-MM-dd')
    return items.filter((i) => i.date === dateStr)
  }, [items, selectedDay])

  return (
    <div className="flex flex-col gap-4 px-4 pb-28 pt-2">
      <h2 className="px-1 text-[20px] font-bold text-white">Időpontok</h2>

      <SegmentedControl
        segments={[
          { key: 'list', label: 'Lista' },
          { key: 'month', label: 'Hónap' },
        ]}
        value={view}
        onChange={(key) => setView(key as 'list' | 'month')}
        layoutId="events-view"
      />

      {view === 'list' ? (
        <Card className="pt-2">
          <AgendaGroupedList items={items} emptyLabel={loading ? 'Betöltés...' : 'Nincs időpont'} onSelect={setSelected} />
        </Card>
      ) : (
        <>
          <MonthCalendar items={items} selectedDay={selectedDay} onSelectDay={setSelectedDay} />
          {selectedDay && (
            <Card className="pt-2">
              <AgendaGroupedList items={dayItems} emptyLabel="Nincs időpont ezen a napon" onSelect={setSelected} />
            </Card>
          )}
        </>
      )}

      <ItemDetailSheet item={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

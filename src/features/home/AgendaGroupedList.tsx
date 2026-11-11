import { useState } from 'react'
import { formatGroupHeader, parseDate } from '../../lib/dateUtils'
import type { AgendaItem } from '../../types'
import { AgendaRow } from './AgendaRow'

interface AgendaGroupedListProps {
  items: AgendaItem[]
  emptyLabel: string
  onSelect: (item: AgendaItem) => void
}

export function AgendaGroupedList({ items, emptyLabel, onSelect }: AgendaGroupedListProps) {
  const groups = groupByDate(items)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  if (groups.length === 0) {
    return (
      <div className="flex items-center justify-center px-6 py-14">
        <p className="text-[16px] font-semibold text-white/80">{emptyLabel}</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-[18px]">
      {groups.map(([date, dateItems]) => {
        const isCollapsed = collapsed[date]
        return (
          <div key={date}>
            <button
              onClick={() => setCollapsed((prev) => ({ ...prev, [date]: !prev[date] }))}
              className="flex w-full items-center justify-center gap-2 border-t border-white/8 px-4 py-2.5 text-[13px] font-semibold text-white/55 first:border-t-0"
            >
              {formatGroupHeader(parseDate(date))}
              <span className={`transition-transform ${isCollapsed ? '-rotate-90' : ''}`}>⌄</span>
            </button>
            {!isCollapsed && (
              <div>
                {dateItems.map((item) => (
                  <AgendaRow key={item.id} item={item} onClick={() => onSelect(item)} />
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function groupByDate(items: AgendaItem[]): [string, AgendaItem[]][] {
  const map = new Map<string, AgendaItem[]>()
  for (const item of items) {
    const list = map.get(item.date) ?? []
    list.push(item)
    map.set(item.date, list)
  }
  return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
}

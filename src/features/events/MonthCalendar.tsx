import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { hu } from 'date-fns/locale'
import { useMemo, useState } from 'react'
import { Card } from '../../components/ui/Card'
import { formatMonthYear, isToday } from '../../lib/dateUtils'
import type { AgendaItem } from '../../types'

const WEEKDAY_LABELS = ['H', 'K', 'Sze', 'Cs', 'P', 'Szo', 'V']

interface MonthCalendarProps {
  items: AgendaItem[]
  onSelectDay: (date: Date) => void
  selectedDay: Date | null
}

export function MonthCalendar({ items, onSelectDay, selectedDay }: MonthCalendarProps) {
  const [anchorDate] = useState(() => new Date())
  const [monthOffset, setMonthOffset] = useState(0)
  const month = useMemo(() => addMonths(anchorDate, monthOffset), [anchorDate, monthOffset])

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [month])

  const datesWithItems = useMemo(() => new Set(items.map((i) => i.date)), [items])

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setMonthOffset((v) => v - 1)}
          aria-label="Előző hónap"
          className="flex h-9 w-9 items-center justify-center rounded-full text-lg text-white/70 active:bg-white/10"
        >
          ‹
        </button>
        <span className="text-[15px] font-semibold capitalize text-white">{formatMonthYear(month)}</span>
        <button
          onClick={() => setMonthOffset((v) => v + 1)}
          aria-label="Következő hónap"
          className="flex h-9 w-9 items-center justify-center rounded-full text-lg text-white/70 active:bg-white/10"
        >
          ›
        </button>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[12px] font-semibold text-white/40">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label}>{label}</div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const inMonth = isSameMonth(day, month)
          const hasItems = datesWithItems.has(dateStr)
          const selected = selectedDay && isSameDay(day, selectedDay)
          return (
            <button
              key={dateStr}
              onClick={() => onSelectDay(day)}
              className={`flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[14px] ${
                selected
                  ? 'bg-[var(--accent)] font-semibold text-black'
                  : isToday(day)
                    ? 'font-semibold text-white'
                    : inMonth
                      ? 'text-white/80'
                      : 'text-white/25'
              }`}
            >
              {format(day, 'd', { locale: hu })}
              <span
                className={`h-1 w-1 rounded-full ${hasItems ? (selected ? 'bg-black' : 'bg-[var(--accent)]') : 'bg-transparent'}`}
              />
            </button>
          )
        })}
      </div>
    </Card>
  )
}

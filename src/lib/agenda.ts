import { format } from 'date-fns'
import type { AgendaItem, Bill, BudgetCategory, Deadline, EventItem } from '../types'

export function deadlineAgendaItems(deadlines: Deadline[]): AgendaItem[] {
  return deadlines.map((d) => ({
    id: d.id,
    type: 'deadline',
    date: d.dueDate,
    time: d.dueTime,
    title: d.title,
    label: d.done ? 'Határidő · Kész' : 'Határidő',
    value: d.dueTime ?? 'Esedékes',
    assigneeIds: d.assigneeIds,
  }))
}

export function eventAgendaItems(events: EventItem[]): AgendaItem[] {
  return events.map((e) => {
    const start = new Date(e.startAt)
    const date = format(start, 'yyyy-MM-dd')
    const time = format(start, 'HH:mm')
    return {
      id: e.id,
      type: 'event',
      date,
      time,
      title: e.title,
      label: e.location ?? 'Időpont',
      value: time,
      assigneeIds: e.participantIds,
    }
  })
}

export function billAgendaItems(bills: Bill[], categories: BudgetCategory[]): AgendaItem[] {
  return bills.map((b) => ({
    id: b.id,
    type: 'bill',
    date: b.dueDate,
    title: b.issuer,
    label: `Számla · ${categories.find((c) => c.id === b.categoryId)?.name ?? ''}`,
    value: `${b.amount.toLocaleString('hu-HU')} Ft`,
    assigneeIds: [],
  }))
}

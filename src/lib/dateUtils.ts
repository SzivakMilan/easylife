import { addDays, format, isSameDay, parseISO, startOfDay } from 'date-fns'
import { hu } from 'date-fns/locale'

const TIME_ZONE = 'Europe/Budapest'

export function today(): Date {
  return startOfDay(new Date())
}

export function parseDate(iso: string): Date {
  return parseISO(iso)
}

/** pl. "nov. 12., Cs" - csoportfejléc a kezdőlapi listához */
export function formatGroupHeader(date: Date): string {
  return format(date, 'MMM d., EEEEEE', { locale: hu })
}

/** pl. "nov. 12., csütörtök" - részletes lap fejléce */
export function formatFullDate(date: Date): string {
  return format(date, 'MMM d., EEEE', { locale: hu })
}

/** pl. "18:00" */
export function formatTime(date: Date): string {
  return format(date, 'HH:mm', { locale: hu })
}

export function formatMonthYear(date: Date): string {
  return format(date, 'yyyy. MMMM', { locale: hu })
}

export function isToday(date: Date): boolean {
  return isSameDay(date, today())
}

export function isYesterday(date: Date): boolean {
  return isSameDay(date, addDays(today(), -1))
}

export function isWithinNextDays(date: Date, days: number): boolean {
  const start = today()
  const end = addDays(start, days)
  return date >= start && date <= end
}

export { TIME_ZONE }

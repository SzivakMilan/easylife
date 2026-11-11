import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { createEvent, deleteEvent, fetchEvents, updateEvent, type EventInput } from '../../lib/api/events'
import { notifyNewItem } from '../../lib/api/notify'
import { useAuth } from '../auth/AuthContext'
import { useHousehold } from '../household/HouseholdContext'
import type { EventItem } from '../../types'

interface EventsContextValue {
  events: EventItem[]
  loading: boolean
  refresh: () => Promise<void>
  create: (input: EventInput) => Promise<void>
  update: (id: string, input: EventInput) => Promise<void>
  remove: (id: string) => Promise<void>
}

const EventsContext = createContext<EventsContextValue | null>(null)

export function EventsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { household } = useHousehold()
  const [events, setEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!household) {
      setEvents([])
      setLoading(false)
      return
    }
    setLoading(true)
    const data = await fetchEvents()
    setEvents(data)
    setLoading(false)
  }, [household])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function create(input: EventInput) {
    if (!household || !user) throw new Error('Nincs háztartásod')
    const id = await createEvent(household.id, user.id, input)
    notifyNewItem('events', id)
    await refresh()
  }

  async function update(id: string, input: EventInput) {
    await updateEvent(id, input)
    await refresh()
  }

  async function remove(id: string) {
    await deleteEvent(id)
    await refresh()
  }

  return (
    <EventsContext.Provider value={{ events, loading, refresh, create, update, remove }}>{children}</EventsContext.Provider>
  )
}

export function useEvents() {
  const ctx = useContext(EventsContext)
  if (!ctx) throw new Error('useEvents must be used within EventsProvider')
  return ctx
}

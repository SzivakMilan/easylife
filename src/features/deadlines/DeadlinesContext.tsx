import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { createDeadline, deleteDeadline, fetchDeadlines, setDeadlineDone, updateDeadline, type DeadlineInput } from '../../lib/api/deadlines'
import { notifyNewItem } from '../../lib/api/notify'
import { useRealtimeRefresh } from '../../lib/realtime'
import { useAuth } from '../auth/AuthContext'
import { useHousehold } from '../household/HouseholdContext'
import type { Deadline } from '../../types'

interface DeadlinesContextValue {
  deadlines: Deadline[]
  loading: boolean
  refresh: () => Promise<void>
  create: (input: DeadlineInput) => Promise<void>
  update: (id: string, input: DeadlineInput) => Promise<void>
  markDone: (id: string, done: boolean) => Promise<void>
  remove: (id: string) => Promise<void>
}

const DeadlinesContext = createContext<DeadlinesContextValue | null>(null)

export function DeadlinesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { household } = useHousehold()
  const [deadlines, setDeadlines] = useState<Deadline[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!household) {
      setDeadlines([])
      setLoading(false)
      return
    }
    setLoading(true)
    const data = await fetchDeadlines()
    setDeadlines(data)
    setLoading(false)
  }, [household])

  useEffect(() => {
    refresh()
  }, [refresh])

  useRealtimeRefresh('deadlines', household?.id, refresh)

  async function create(input: DeadlineInput) {
    if (!household || !user) throw new Error('Nincs háztartásod')
    const id = await createDeadline(household.id, user.id, input)
    notifyNewItem('deadlines', id)
    await refresh()
  }

  async function update(id: string, input: DeadlineInput) {
    await updateDeadline(id, input)
    await refresh()
  }

  async function markDone(id: string, done: boolean) {
    await setDeadlineDone(id, done)
    await refresh()
  }

  async function remove(id: string) {
    await deleteDeadline(id)
    await refresh()
  }

  return (
    <DeadlinesContext.Provider value={{ deadlines, loading, refresh, create, update, markDone, remove }}>
      {children}
    </DeadlinesContext.Provider>
  )
}

export function useDeadlines() {
  const ctx = useContext(DeadlinesContext)
  if (!ctx) throw new Error('useDeadlines must be used within DeadlinesProvider')
  return ctx
}

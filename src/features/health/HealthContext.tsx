import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { createHealthEntry, deleteHealthEntry, fetchHealthEntries, type HealthEntryInput } from '../../lib/api/health'
import { useRealtimeRefresh } from '../../lib/realtime'
import { useAuth } from '../auth/AuthContext'
import { useHousehold } from '../household/HouseholdContext'
import type { HealthEntry } from '../../types'

interface HealthContextValue {
  entries: HealthEntry[]
  loading: boolean
  refresh: () => Promise<void>
  create: (input: HealthEntryInput) => Promise<void>
  remove: (id: string) => Promise<void>
}

const HealthContext = createContext<HealthContextValue | null>(null)

export function HealthProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { household } = useHousehold()
  const [entries, setEntries] = useState<HealthEntry[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!household) {
      setEntries([])
      setLoading(false)
      return
    }
    setLoading(true)
    const data = await fetchHealthEntries()
    setEntries(data)
    setLoading(false)
  }, [household])

  useEffect(() => {
    refresh()
  }, [refresh])

  useRealtimeRefresh('health_entries', household?.id, refresh)

  async function create(input: HealthEntryInput) {
    if (!household || !user) throw new Error('Nincs háztartásod')
    await createHealthEntry(household.id, user.id, input)
    await refresh()
  }

  async function remove(id: string) {
    await deleteHealthEntry(id)
    await refresh()
  }

  return (
    <HealthContext.Provider value={{ entries, loading, refresh, create, remove }}>
      {children}
    </HealthContext.Provider>
  )
}

export function useHealth() {
  const ctx = useContext(HealthContext)
  if (!ctx) throw new Error('useHealth must be used within HealthProvider')
  return ctx
}

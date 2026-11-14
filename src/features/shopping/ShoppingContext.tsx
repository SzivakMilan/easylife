import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  clearCheckedShoppingItems,
  createShoppingItem,
  deleteShoppingItem,
  fetchShoppingItems,
  setShoppingItemChecked,
} from '../../lib/api/shoppingItems'
import { useRealtimeRefresh } from '../../lib/realtime'
import { useAuth } from '../auth/AuthContext'
import { useHousehold } from '../household/HouseholdContext'
import type { ShoppingItem } from '../../types'

interface ShoppingContextValue {
  items: ShoppingItem[]
  loading: boolean
  refresh: () => Promise<void>
  create: (name: string) => Promise<void>
  setChecked: (id: string, checked: boolean) => Promise<void>
  remove: (id: string) => Promise<void>
  clearChecked: () => Promise<void>
}

const ShoppingContext = createContext<ShoppingContextValue | null>(null)

export function ShoppingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { household } = useHousehold()
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!household) {
      setItems([])
      setLoading(false)
      return
    }
    setLoading(true)
    const data = await fetchShoppingItems()
    setItems(data)
    setLoading(false)
  }, [household])

  useEffect(() => {
    refresh()
  }, [refresh])

  useRealtimeRefresh('shopping_items', household?.id, refresh)

  async function create(name: string) {
    if (!household || !user) throw new Error('Nincs háztartásod')
    await createShoppingItem(household.id, user.id, name)
    await refresh()
  }

  async function setChecked(id: string, checked: boolean) {
    await setShoppingItemChecked(id, checked)
    await refresh()
  }

  async function remove(id: string) {
    await deleteShoppingItem(id)
    await refresh()
  }

  async function clearChecked() {
    if (!household) return
    await clearCheckedShoppingItems(household.id)
    await refresh()
  }

  return (
    <ShoppingContext.Provider value={{ items, loading, refresh, create, setChecked, remove, clearChecked }}>
      {children}
    </ShoppingContext.Provider>
  )
}

export function useShopping() {
  const ctx = useContext(ShoppingContext)
  if (!ctx) throw new Error('useShopping must be used within ShoppingProvider')
  return ctx
}

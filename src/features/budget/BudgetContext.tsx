import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  createBudgetCategory,
  createBudgetItem,
  deleteBudgetItem,
  fetchBudgetCategories,
  fetchBudgetItems,
  updateBudgetCategory,
  updateBudgetItem,
  type BudgetItemInput,
  type CategoryInput,
} from '../../lib/api/budget'
import { useAuth } from '../auth/AuthContext'
import { useHousehold } from '../household/HouseholdContext'
import type { BudgetCategory, BudgetItem } from '../../types'

interface BudgetContextValue {
  categories: BudgetCategory[]
  items: BudgetItem[]
  loading: boolean
  refresh: () => Promise<void>
  createCategory: (input: CategoryInput) => Promise<void>
  updateCategory: (id: string, input: CategoryInput) => Promise<void>
  createItem: (input: BudgetItemInput) => Promise<void>
  updateItem: (id: string, input: BudgetItemInput) => Promise<void>
  deleteItem: (id: string) => Promise<void>
}

const BudgetContext = createContext<BudgetContextValue | null>(null)

export function BudgetProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { household } = useHousehold()
  const [categories, setCategories] = useState<BudgetCategory[]>([])
  const [items, setItems] = useState<BudgetItem[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!household) {
      setCategories([])
      setItems([])
      setLoading(false)
      return
    }
    setLoading(true)
    const [categoriesData, itemsData] = await Promise.all([fetchBudgetCategories(), fetchBudgetItems()])
    setCategories(categoriesData)
    setItems(itemsData)
    setLoading(false)
  }, [household])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function createCategory(input: CategoryInput) {
    if (!household) throw new Error('Nincs háztartásod')
    await createBudgetCategory(household.id, input)
    await refresh()
  }

  async function updateCategory(id: string, input: CategoryInput) {
    await updateBudgetCategory(id, input)
    await refresh()
  }

  async function createItem(input: BudgetItemInput) {
    if (!household || !user) throw new Error('Nincs háztartásod')
    await createBudgetItem(household.id, user.id, input)
    await refresh()
  }

  async function updateItem(id: string, input: BudgetItemInput) {
    await updateBudgetItem(id, input)
    await refresh()
  }

  async function deleteItem(id: string) {
    await deleteBudgetItem(id)
    await refresh()
  }

  return (
    <BudgetContext.Provider
      value={{ categories, items, loading, refresh, createCategory, updateCategory, createItem, updateItem, deleteItem }}
    >
      {children}
    </BudgetContext.Provider>
  )
}

export function useBudget() {
  const ctx = useContext(BudgetContext)
  if (!ctx) throw new Error('useBudget must be used within BudgetProvider')
  return ctx
}

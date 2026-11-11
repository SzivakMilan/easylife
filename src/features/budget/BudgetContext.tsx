import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  createBudgetCategory,
  createBudgetItem,
  deleteBudgetItem,
  deleteBudgetCategory,
  fetchBudgetCategories,
  fetchBudgetItems,
  updateBudgetCategory,
  updateBudgetItem,
  type BudgetItemInput,
  type CategoryInput,
} from '../../lib/api/budget'
import {
  createSavingsContribution,
  createSavingsGoal,
  deleteSavingsContribution,
  deleteSavingsGoal,
  fetchSavingsContributions,
  fetchSavingsGoals,
  updateSavingsGoal,
  type SavingsContributionInput,
  type SavingsGoalInput,
} from '../../lib/api/savingsGoals'
import { useAuth } from '../auth/AuthContext'
import { useHousehold } from '../household/HouseholdContext'
import type { BudgetCategory, BudgetItem, SavingsContribution, SavingsGoal } from '../../types'

interface BudgetContextValue {
  categories: BudgetCategory[]
  items: BudgetItem[]
  savingsGoals: SavingsGoal[]
  savingsContributions: SavingsContribution[]
  loading: boolean
  refresh: () => Promise<void>
  createCategory: (input: CategoryInput) => Promise<void>
  updateCategory: (id: string, input: CategoryInput) => Promise<void>
  deleteCategory: (id: string) => Promise<void>
  createItem: (input: BudgetItemInput) => Promise<void>
  updateItem: (id: string, input: BudgetItemInput) => Promise<void>
  deleteItem: (id: string) => Promise<void>
  createGoal: (input: SavingsGoalInput) => Promise<void>
  updateGoal: (id: string, input: SavingsGoalInput) => Promise<void>
  deleteGoal: (id: string) => Promise<void>
  addContribution: (input: SavingsContributionInput) => Promise<void>
  deleteContribution: (id: string) => Promise<void>
}

const BudgetContext = createContext<BudgetContextValue | null>(null)

export function BudgetProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { household } = useHousehold()
  const [categories, setCategories] = useState<BudgetCategory[]>([])
  const [items, setItems] = useState<BudgetItem[]>([])
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([])
  const [savingsContributions, setSavingsContributions] = useState<SavingsContribution[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!household) {
      setCategories([])
      setItems([])
      setSavingsGoals([])
      setSavingsContributions([])
      setLoading(false)
      return
    }
    setLoading(true)
    const [categoriesData, itemsData, goalsData, contributionsData] = await Promise.all([
      fetchBudgetCategories(),
      fetchBudgetItems(),
      fetchSavingsGoals(),
      fetchSavingsContributions(),
    ])
    setCategories(categoriesData)
    setItems(itemsData)
    setSavingsGoals(goalsData)
    setSavingsContributions(contributionsData)
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

  async function deleteCategory(id: string) {
    await deleteBudgetCategory(id)
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

  async function createGoal(input: SavingsGoalInput) {
    if (!household || !user) throw new Error('Nincs háztartásod')
    await createSavingsGoal(household.id, user.id, input)
    await refresh()
  }

  async function updateGoal(id: string, input: SavingsGoalInput) {
    await updateSavingsGoal(id, input)
    await refresh()
  }

  async function deleteGoal(id: string) {
    await deleteSavingsGoal(id)
    await refresh()
  }

  async function addContribution(input: SavingsContributionInput) {
    if (!household || !user) throw new Error('Nincs háztartásod')
    await createSavingsContribution(household.id, user.id, input)
    await refresh()
  }

  async function deleteContribution(id: string) {
    await deleteSavingsContribution(id)
    await refresh()
  }

  return (
    <BudgetContext.Provider
      value={{
        categories,
        items,
        savingsGoals,
        savingsContributions,
        loading,
        refresh,
        createCategory,
        updateCategory,
        deleteCategory,
        createItem,
        updateItem,
        deleteItem,
        createGoal,
        updateGoal,
        deleteGoal,
        addContribution,
        deleteContribution,
      }}
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

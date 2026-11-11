import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { createBill, deleteBill, fetchBills, markBillPaid, updateBill, type BillInput } from '../../lib/api/bills'
import { notifyNewItem } from '../../lib/api/notify'
import { useAuth } from '../auth/AuthContext'
import { useHousehold } from '../household/HouseholdContext'
import { useBudget } from '../budget/BudgetContext'
import type { Bill } from '../../types'

interface BillsContextValue {
  bills: Bill[]
  loading: boolean
  refresh: () => Promise<void>
  create: (input: BillInput) => Promise<void>
  update: (id: string, input: BillInput) => Promise<void>
  markPaid: (bill: Bill) => Promise<void>
  remove: (bill: Bill) => Promise<void>
}

const BillsContext = createContext<BillsContextValue | null>(null)

export function BillsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { household } = useHousehold()
  const { refresh: refreshBudget } = useBudget()
  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!household) {
      setBills([])
      setLoading(false)
      return
    }
    setLoading(true)
    const data = await fetchBills()
    setBills(data)
    setLoading(false)
  }, [household])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function create(input: BillInput) {
    if (!household || !user) throw new Error('Nincs háztartásod')
    const id = await createBill(household.id, user.id, input)
    notifyNewItem('bills', id)
    await refresh()
  }

  async function update(id: string, input: BillInput) {
    await updateBill(id, input)
    await refresh()
  }

  async function markPaid(bill: Bill) {
    if (!household || !user) throw new Error('Nincs háztartásod')
    await markBillPaid(bill, household.id, user.id)
    await Promise.all([refresh(), refreshBudget()])
  }

  async function remove(bill: Bill) {
    await deleteBill(bill)
    await refresh()
  }

  return (
    <BillsContext.Provider value={{ bills, loading, refresh, create, update, markPaid, remove }}>
      {children}
    </BillsContext.Provider>
  )
}

export function useBills() {
  const ctx = useContext(BillsContext)
  if (!ctx) throw new Error('useBills must be used within BillsProvider')
  return ctx
}

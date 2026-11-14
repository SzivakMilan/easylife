import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  clearCheckedPackingItems,
  createDocument,
  createExpense,
  createPackingItem,
  createTrip,
  deleteDocument,
  deleteExpense,
  deletePackingItem,
  deleteTrip,
  fetchDocuments,
  fetchExpenses,
  fetchPackingItems,
  fetchTrips,
  getTripFileSignedUrl,
  setPackingItemChecked,
  updateTrip,
  uploadTripFile,
  type ExpenseInput,
  type TripInput,
} from '../../lib/api/trips'
import { useRealtimeRefresh } from '../../lib/realtime'
import { useAuth } from '../auth/AuthContext'
import { useHousehold } from '../household/HouseholdContext'
import type { Trip, TripDocument, TripExpense, TripPackingItem } from '../../types'

interface TripsContextValue {
  trips: Trip[]
  packingItems: TripPackingItem[]
  expenses: TripExpense[]
  documents: TripDocument[]
  loading: boolean
  refresh: () => Promise<void>
  createTrip: (input: TripInput) => Promise<void>
  updateTrip: (id: string, input: TripInput) => Promise<void>
  removeTrip: (id: string) => Promise<void>
  addPackingItem: (tripId: string, name: string) => Promise<void>
  togglePackingItem: (id: string, checked: boolean) => Promise<void>
  removePackingItem: (id: string) => Promise<void>
  clearCheckedPacking: (tripId: string) => Promise<void>
  addExpense: (input: ExpenseInput) => Promise<void>
  removeExpense: (id: string) => Promise<void>
  addDocument: (tripId: string, label: string, file: File) => Promise<void>
  openDocument: (document: TripDocument) => Promise<string>
  removeDocument: (document: TripDocument) => Promise<void>
}

const TripsContext = createContext<TripsContextValue | null>(null)

export function TripsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { household } = useHousehold()
  const [trips, setTrips] = useState<Trip[]>([])
  const [packingItems, setPackingItems] = useState<TripPackingItem[]>([])
  const [expenses, setExpenses] = useState<TripExpense[]>([])
  const [documents, setDocuments] = useState<TripDocument[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!household) {
      setTrips([])
      setPackingItems([])
      setExpenses([])
      setDocuments([])
      setLoading(false)
      return
    }
    setLoading(true)
    const [tripsData, packingData, expensesData, documentsData] = await Promise.all([
      fetchTrips(),
      fetchPackingItems(),
      fetchExpenses(),
      fetchDocuments(),
    ])
    setTrips(tripsData)
    setPackingItems(packingData)
    setExpenses(expensesData)
    setDocuments(documentsData)
    setLoading(false)
  }, [household])

  useEffect(() => {
    refresh()
  }, [refresh])

  useRealtimeRefresh('trips', household?.id, refresh)

  async function handleCreateTrip(input: TripInput) {
    if (!household || !user) throw new Error('Nincs háztartásod')
    await createTrip(household.id, user.id, input)
    await refresh()
  }

  async function handleUpdateTrip(id: string, input: TripInput) {
    await updateTrip(id, input)
    await refresh()
  }

  async function removeTrip(id: string) {
    await deleteTrip(id)
    await refresh()
  }

  async function addPackingItem(tripId: string, name: string) {
    if (!user) throw new Error('Nincs bejelentkezve')
    await createPackingItem(tripId, user.id, name)
    await refresh()
  }

  async function togglePackingItem(id: string, checked: boolean) {
    await setPackingItemChecked(id, checked)
    await refresh()
  }

  async function removePackingItem(id: string) {
    await deletePackingItem(id)
    await refresh()
  }

  async function clearCheckedPacking(tripId: string) {
    await clearCheckedPackingItems(tripId)
    await refresh()
  }

  async function addExpense(input: ExpenseInput) {
    if (!user) throw new Error('Nincs bejelentkezve')
    await createExpense(user.id, input)
    await refresh()
  }

  async function removeExpense(id: string) {
    await deleteExpense(id)
    await refresh()
  }

  async function addDocument(tripId: string, label: string, file: File) {
    if (!household || !user) throw new Error('Nincs háztartásod')
    const filePath = await uploadTripFile(household.id, tripId, file)
    await createDocument(user.id, tripId, label, filePath)
    await refresh()
  }

  async function openDocument(document: TripDocument) {
    return getTripFileSignedUrl(document.filePath)
  }

  async function removeDocument(document: TripDocument) {
    await deleteDocument(document)
    await refresh()
  }

  return (
    <TripsContext.Provider
      value={{
        trips,
        packingItems,
        expenses,
        documents,
        loading,
        refresh,
        createTrip: handleCreateTrip,
        updateTrip: handleUpdateTrip,
        removeTrip,
        addPackingItem,
        togglePackingItem,
        removePackingItem,
        clearCheckedPacking,
        addExpense,
        removeExpense,
        addDocument,
        openDocument,
        removeDocument,
      }}
    >
      {children}
    </TripsContext.Provider>
  )
}

export function useTrips() {
  const ctx = useContext(TripsContext)
  if (!ctx) throw new Error('useTrips must be used within TripsProvider')
  return ctx
}

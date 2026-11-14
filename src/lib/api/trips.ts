import { supabase } from '../supabaseClient'
import type { Trip, TripDocument, TripExpense, TripPackingItem } from '../../types'

interface TripRow {
  id: string
  name: string
  destination: string | null
  start_date: string
  end_date: string | null
  note: string | null
  trip_participants: { member_id: string }[]
}

function mapTrip(row: TripRow): Trip {
  return {
    id: row.id,
    name: row.name,
    destination: row.destination ?? undefined,
    startDate: row.start_date,
    endDate: row.end_date ?? undefined,
    note: row.note ?? undefined,
    participantIds: (row.trip_participants ?? []).map((p) => p.member_id),
  }
}

export async function fetchTrips(): Promise<Trip[]> {
  const { data, error } = await supabase
    .from('trips')
    .select('id, name, destination, start_date, end_date, note, trip_participants(member_id)')
    .order('start_date', { ascending: false })
  if (error) throw error
  return (data ?? []).map(mapTrip)
}

export interface TripInput {
  name: string
  destination?: string
  startDate: string
  endDate?: string
  note?: string
  participantIds: string[]
}

export async function createTrip(householdId: string, userId: string, input: TripInput): Promise<string> {
  const { data, error } = await supabase
    .from('trips')
    .insert({
      household_id: householdId,
      name: input.name,
      destination: input.destination?.trim() || null,
      start_date: input.startDate,
      end_date: input.endDate || null,
      note: input.note?.trim() || null,
      created_by: userId,
    })
    .select('id')
    .single()
  if (error || !data) throw error ?? new Error('Nem sikerült létrehozni az utazást')

  const tripId = data.id
  if (input.participantIds.length > 0) {
    const { error: participantsError } = await supabase
      .from('trip_participants')
      .insert(input.participantIds.map((memberId) => ({ trip_id: tripId, member_id: memberId })))
    if (participantsError) throw participantsError
  }
  return tripId
}

export async function updateTrip(id: string, input: TripInput): Promise<void> {
  const { error } = await supabase
    .from('trips')
    .update({
      name: input.name,
      destination: input.destination?.trim() || null,
      start_date: input.startDate,
      end_date: input.endDate || null,
      note: input.note?.trim() || null,
    })
    .eq('id', id)
  if (error) throw error

  const { error: deleteError } = await supabase.from('trip_participants').delete().eq('trip_id', id)
  if (deleteError) throw deleteError
  if (input.participantIds.length > 0) {
    const { error: participantsError } = await supabase
      .from('trip_participants')
      .insert(input.participantIds.map((memberId) => ({ trip_id: id, member_id: memberId })))
    if (participantsError) throw participantsError
  }
}

export async function deleteTrip(id: string): Promise<void> {
  const { error } = await supabase.from('trips').delete().eq('id', id)
  if (error) throw error
}

interface PackingItemRow {
  id: string
  trip_id: string
  name: string
  checked: boolean
}

function mapPackingItem(row: PackingItemRow): TripPackingItem {
  return { id: row.id, tripId: row.trip_id, name: row.name, checked: row.checked }
}

export async function fetchPackingItems(): Promise<TripPackingItem[]> {
  const { data, error } = await supabase
    .from('trip_packing_items')
    .select('id, trip_id, name, checked')
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []).map(mapPackingItem)
}

export async function createPackingItem(tripId: string, userId: string, name: string): Promise<void> {
  const { error } = await supabase.from('trip_packing_items').insert({ trip_id: tripId, name, created_by: userId })
  if (error) throw error
}

export async function setPackingItemChecked(id: string, checked: boolean): Promise<void> {
  const { error } = await supabase.from('trip_packing_items').update({ checked }).eq('id', id)
  if (error) throw error
}

export async function deletePackingItem(id: string): Promise<void> {
  const { error } = await supabase.from('trip_packing_items').delete().eq('id', id)
  if (error) throw error
}

export async function clearCheckedPackingItems(tripId: string): Promise<void> {
  const { error } = await supabase.from('trip_packing_items').delete().eq('trip_id', tripId).eq('checked', true)
  if (error) throw error
}

interface ExpenseRow {
  id: string
  trip_id: string
  amount: number
  note: string | null
  occurred_on: string
}

function mapExpense(row: ExpenseRow): TripExpense {
  return {
    id: row.id,
    tripId: row.trip_id,
    amount: Number(row.amount),
    note: row.note ?? undefined,
    occurredOn: row.occurred_on,
  }
}

export async function fetchExpenses(): Promise<TripExpense[]> {
  const { data, error } = await supabase
    .from('trip_expenses')
    .select('id, trip_id, amount, note, occurred_on')
    .order('occurred_on', { ascending: false })
  if (error) throw error
  return (data ?? []).map(mapExpense)
}

export interface ExpenseInput {
  tripId: string
  amount: number
  note?: string
  occurredOn: string
}

export async function createExpense(userId: string, input: ExpenseInput): Promise<void> {
  const { error } = await supabase.from('trip_expenses').insert({
    trip_id: input.tripId,
    amount: input.amount,
    note: input.note?.trim() || null,
    occurred_on: input.occurredOn,
    created_by: userId,
  })
  if (error) throw error
}

export async function deleteExpense(id: string): Promise<void> {
  const { error } = await supabase.from('trip_expenses').delete().eq('id', id)
  if (error) throw error
}

interface DocumentRow {
  id: string
  trip_id: string
  label: string
  file_path: string
}

function mapDocument(row: DocumentRow): TripDocument {
  return { id: row.id, tripId: row.trip_id, label: row.label, filePath: row.file_path }
}

export async function fetchDocuments(): Promise<TripDocument[]> {
  const { data, error } = await supabase
    .from('trip_documents')
    .select('id, trip_id, label, file_path')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(mapDocument)
}

export async function uploadTripFile(householdId: string, tripId: string, file: File): Promise<string> {
  const path = `${householdId}/${tripId}/${crypto.randomUUID()}-${file.name}`
  const { error } = await supabase.storage.from('trips').upload(path, file)
  if (error) throw error
  return path
}

export async function getTripFileSignedUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from('trips').createSignedUrl(path, 60 * 10)
  if (error || !data) throw error ?? new Error('Nem sikerült megnyitni a fájlt')
  return data.signedUrl
}

export async function createDocument(userId: string, tripId: string, label: string, filePath: string): Promise<void> {
  const { error } = await supabase
    .from('trip_documents')
    .insert({ trip_id: tripId, label, file_path: filePath, created_by: userId })
  if (error) throw error
}

export async function deleteDocument(document: TripDocument): Promise<void> {
  const { error } = await supabase.from('trip_documents').delete().eq('id', document.id)
  if (error) throw error
  await supabase.storage.from('trips').remove([document.filePath])
}

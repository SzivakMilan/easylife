import { addMonths, addWeeks, addYears } from 'date-fns'
import { supabase } from '../supabaseClient'
import type { Bill, Recurrence } from '../../types'

interface BillRow {
  id: string
  issuer: string
  amount: number
  due_date: string
  category_id: string | null
  status: string
  paid_at: string | null
  recurrence: string
  file_path: string | null
  reminder_offset_minutes: number | null
}

function mapRow(row: BillRow): Bill {
  return {
    id: row.id,
    issuer: row.issuer,
    amount: Number(row.amount),
    dueDate: row.due_date,
    categoryId: row.category_id ?? '',
    status: row.status === 'paid' ? 'paid' : 'pending',
    paidAt: row.paid_at ?? undefined,
    recurrence: (row.recurrence as Recurrence) ?? 'none',
    filePath: row.file_path ?? undefined,
    reminderOffsetMinutes: row.reminder_offset_minutes ?? undefined,
  }
}

export async function fetchBills(): Promise<Bill[]> {
  const { data, error } = await supabase
    .from('bills')
    .select('id, issuer, amount, due_date, category_id, status, paid_at, recurrence, file_path, reminder_offset_minutes')
    .order('due_date', { ascending: false })
  if (error) throw error
  return (data ?? []).map(mapRow)
}

export interface BillInput {
  issuer: string
  amount: number
  dueDate: string
  categoryId: string
  recurrence: Recurrence
  filePath?: string
  reminderOffsetMinutes?: number
  viewerIds?: string[]
}

export async function createBill(householdId: string, userId: string, input: BillInput): Promise<string> {
  const { data, error } = await supabase
    .from('bills')
    .insert({
      household_id: householdId,
      issuer: input.issuer,
      amount: input.amount,
      due_date: input.dueDate,
      category_id: input.categoryId,
      recurrence: input.recurrence,
      file_path: input.filePath ?? null,
      reminder_offset_minutes: input.reminderOffsetMinutes ?? null,
      created_by: userId,
    })
    .select('id')
    .single()
  if (error || !data) throw error ?? new Error('Nem sikerült rögzíteni a számlát')

  const billId = data.id

  if (input.viewerIds && input.viewerIds.length > 0) {
    const { error: viewerError } = await supabase
      .from('bill_viewers')
      .insert(input.viewerIds.map((memberId) => ({ bill_id: billId, member_id: memberId })))
    if (viewerError) throw viewerError
  }

  return billId
}

export async function updateBill(id: string, input: BillInput): Promise<void> {
  const { error } = await supabase
    .from('bills')
    .update({
      issuer: input.issuer,
      amount: input.amount,
      due_date: input.dueDate,
      category_id: input.categoryId,
      recurrence: input.recurrence,
      file_path: input.filePath ?? null,
      reminder_offset_minutes: input.reminderOffsetMinutes ?? null,
    })
    .eq('id', id)
  if (error) throw error
}

function nextDueDate(dueDate: string, recurrence: Recurrence): string | null {
  const date = new Date(`${dueDate}T00:00:00`)
  if (recurrence === 'weekly') return addWeeks(date, 1).toISOString().slice(0, 10)
  if (recurrence === 'monthly') return addMonths(date, 1).toISOString().slice(0, 10)
  if (recurrence === 'yearly') return addYears(date, 1).toISOString().slice(0, 10)
  return null
}

/**
 * Fizetettre jelöli a számlát, kiadásként könyveli a költségvetésben, és ha a számla
 * ismétlődő, létrehozza a következő esedékes példányt "Fizetendő" állapotban.
 */
export async function markBillPaid(bill: Bill, householdId: string, userId: string): Promise<void> {
  const paidAt = new Date().toISOString().slice(0, 10)

  const { error: updateError } = await supabase
    .from('bills')
    .update({ status: 'paid', paid_at: paidAt })
    .eq('id', bill.id)
  if (updateError) throw updateError

  const { data: budgetItem, error: itemError } = await supabase
    .from('budget_items')
    .insert({
      household_id: householdId,
      category_id: bill.categoryId,
      type: 'expense',
      amount: bill.amount,
      note: `Számla: ${bill.issuer}`,
      occurred_on: paidAt,
      source_bill_id: bill.id,
      created_by: userId,
    })
    .select('id')
    .single()
  if (itemError || !budgetItem) throw itemError ?? new Error('Nem sikerült könyvelni a kiadást')

  const next = nextDueDate(bill.dueDate, bill.recurrence)
  if (next) {
    const { error: nextError } = await supabase.from('bills').insert({
      household_id: householdId,
      issuer: bill.issuer,
      amount: bill.amount,
      due_date: next,
      category_id: bill.categoryId,
      recurrence: bill.recurrence,
      reminder_offset_minutes: bill.reminderOffsetMinutes ?? null,
      created_by: userId,
    })
    if (nextError) throw nextError
  }
}

export async function uploadBillFile(householdId: string, file: File): Promise<string> {
  const path = `${householdId}/${crypto.randomUUID()}-${file.name}`
  const { error } = await supabase.storage.from('bills').upload(path, file)
  if (error) throw error
  return path
}

export async function getBillFileSignedUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from('bills').createSignedUrl(path, 60 * 10)
  if (error || !data) throw error ?? new Error('Nem sikerült megnyitni a fájlt')
  return data.signedUrl
}

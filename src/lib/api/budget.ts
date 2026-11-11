import { supabase } from '../supabaseClient'
import type { BudgetCategory, BudgetItem } from '../../types'

interface CategoryRow {
  id: string
  name: string
  color: string
  icon: string
  monthly_limit: number
}

interface ItemRow {
  id: string
  category_id: string
  type: string
  amount: number
  note: string | null
  occurred_on: string
}

function mapCategory(row: CategoryRow): BudgetCategory {
  return { id: row.id, name: row.name, color: row.color, icon: row.icon, monthlyLimit: Number(row.monthly_limit) }
}

function mapItem(row: ItemRow): BudgetItem {
  return {
    id: row.id,
    categoryId: row.category_id,
    type: row.type === 'income' ? 'income' : 'expense',
    amount: Number(row.amount),
    note: row.note ?? undefined,
    occurredOn: row.occurred_on,
  }
}

export async function fetchBudgetCategories(): Promise<BudgetCategory[]> {
  const { data, error } = await supabase
    .from('budget_categories')
    .select('id, name, color, icon, monthly_limit')
    .order('name', { ascending: true })
  if (error) throw error
  return (data ?? []).map(mapCategory)
}

export async function fetchBudgetItems(): Promise<BudgetItem[]> {
  const { data, error } = await supabase
    .from('budget_items')
    .select('id, category_id, type, amount, note, occurred_on')
    .order('occurred_on', { ascending: false })
  if (error) throw error
  return (data ?? []).map(mapItem)
}

export interface CategoryInput {
  name: string
  color: string
  icon: string
  monthlyLimit: number
}

export async function createBudgetCategory(householdId: string, input: CategoryInput): Promise<string> {
  const { data, error } = await supabase
    .from('budget_categories')
    .insert({ household_id: householdId, name: input.name, color: input.color, icon: input.icon, monthly_limit: input.monthlyLimit })
    .select('id')
    .single()
  if (error || !data) throw error ?? new Error('Nem sikerült létrehozni a kategóriát')
  return data.id
}

export async function updateBudgetCategory(id: string, input: CategoryInput): Promise<void> {
  const { error } = await supabase
    .from('budget_categories')
    .update({ name: input.name, color: input.color, icon: input.icon, monthly_limit: input.monthlyLimit })
    .eq('id', id)
  if (error) throw error
}

export interface BudgetItemInput {
  categoryId: string
  type: 'expense' | 'income'
  amount: number
  note?: string
  occurredOn: string
}

export async function createBudgetItem(householdId: string, userId: string, input: BudgetItemInput): Promise<string> {
  const { data, error } = await supabase
    .from('budget_items')
    .insert({
      household_id: householdId,
      category_id: input.categoryId,
      type: input.type,
      amount: input.amount,
      note: input.note ?? null,
      occurred_on: input.occurredOn,
      created_by: userId,
    })
    .select('id')
    .single()
  if (error || !data) throw error ?? new Error('Nem sikerült rögzíteni a tételt')
  return data.id
}

export async function updateBudgetItem(id: string, input: BudgetItemInput): Promise<void> {
  const { error } = await supabase
    .from('budget_items')
    .update({
      category_id: input.categoryId,
      type: input.type,
      amount: input.amount,
      note: input.note ?? null,
      occurred_on: input.occurredOn,
    })
    .eq('id', id)
  if (error) throw error
}

export async function deleteBudgetItem(id: string): Promise<void> {
  const { error } = await supabase.from('budget_items').delete().eq('id', id)
  if (error) throw error
}

/** Törli a kategóriát a benne lévő tételekkel együtt (budget_items ON DELETE CASCADE). */
export async function deleteBudgetCategory(id: string): Promise<void> {
  // A kategóriához rendelt számlák megmaradnak, csak kategória nélkül
  const { error: billsError } = await supabase.from('bills').update({ category_id: null }).eq('category_id', id)
  if (billsError) throw billsError
  const { error } = await supabase.from('budget_categories').delete().eq('id', id)
  if (error) throw error
}

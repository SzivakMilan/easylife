import { supabase } from '../supabaseClient'
import type { ShoppingItem } from '../../types'

interface ShoppingItemRow {
  id: string
  name: string
  checked: boolean
  created_at: string
}

function mapRow(row: ShoppingItemRow): ShoppingItem {
  return { id: row.id, name: row.name, checked: row.checked, createdAt: row.created_at }
}

export async function fetchShoppingItems(): Promise<ShoppingItem[]> {
  const { data, error } = await supabase
    .from('shopping_items')
    .select('id, name, checked, created_at')
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []).map(mapRow)
}

export async function createShoppingItem(householdId: string, userId: string, name: string): Promise<string> {
  const { data, error } = await supabase
    .from('shopping_items')
    .insert({ household_id: householdId, name, created_by: userId })
    .select('id')
    .single()
  if (error || !data) throw error ?? new Error('Nem sikerült hozzáadni a tételt')
  return data.id
}

export async function setShoppingItemChecked(id: string, checked: boolean): Promise<void> {
  const { error } = await supabase.from('shopping_items').update({ checked }).eq('id', id)
  if (error) throw error
}

export async function deleteShoppingItem(id: string): Promise<void> {
  const { error } = await supabase.from('shopping_items').delete().eq('id', id)
  if (error) throw error
}

export async function clearCheckedShoppingItems(householdId: string): Promise<void> {
  const { error } = await supabase
    .from('shopping_items')
    .delete()
    .eq('household_id', householdId)
    .eq('checked', true)
  if (error) throw error
}

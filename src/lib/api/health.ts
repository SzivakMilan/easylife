import { supabase } from '../supabaseClient'
import type { HealthEntry, HealthEntryType } from '../../types'

interface HealthEntryRow {
  id: string
  type: string
  amount: number | null
  note: string | null
  occurred_at: string
}

function mapRow(row: HealthEntryRow): HealthEntry {
  return {
    id: row.id,
    type: row.type as HealthEntryType,
    amount: row.amount ?? undefined,
    note: row.note ?? undefined,
    occurredAt: row.occurred_at,
  }
}

export interface HealthEntryInput {
  type: HealthEntryType
  amount?: number
  note?: string
  occurredAt?: string
}

export async function fetchHealthEntries(): Promise<HealthEntry[]> {
  const { data, error } = await supabase
    .from('health_entries')
    .select('id, type, amount, note, occurred_at')
    .order('occurred_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(mapRow)
}

export async function createHealthEntry(
  householdId: string,
  userId: string,
  input: HealthEntryInput,
): Promise<string> {
  const { data, error } = await supabase
    .from('health_entries')
    .insert({
      household_id: householdId,
      created_by: userId,
      type: input.type,
      amount: input.amount ?? null,
      note: input.note?.trim() || null,
      occurred_at: input.occurredAt ?? new Date().toISOString(),
    })
    .select('id')
    .single()
  if (error || !data) throw error ?? new Error('Nem sikerült rögzíteni a bejegyzést')
  return data.id
}

export async function deleteHealthEntry(id: string): Promise<void> {
  const { error } = await supabase.from('health_entries').delete().eq('id', id)
  if (error) throw error
}

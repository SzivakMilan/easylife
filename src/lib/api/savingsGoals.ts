import { supabase } from '../supabaseClient'
import type { SavingsGoal, SavingsContribution } from '../../types'

interface GoalRow {
  id: string
  name: string
  color: string
  icon: string
  target_amount: number
}

interface ContributionRow {
  id: string
  goal_id: string
  amount: number
  note: string | null
  occurred_on: string
}

function mapGoal(row: GoalRow): SavingsGoal {
  return { id: row.id, name: row.name, color: row.color, icon: row.icon, targetAmount: Number(row.target_amount) }
}

function mapContribution(row: ContributionRow): SavingsContribution {
  return {
    id: row.id,
    goalId: row.goal_id,
    amount: Number(row.amount),
    note: row.note ?? undefined,
    occurredOn: row.occurred_on,
  }
}

export async function fetchSavingsGoals(): Promise<SavingsGoal[]> {
  const { data, error } = await supabase
    .from('savings_goals')
    .select('id, name, color, icon, target_amount')
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []).map(mapGoal)
}

export async function fetchSavingsContributions(): Promise<SavingsContribution[]> {
  const { data, error } = await supabase
    .from('savings_contributions')
    .select('id, goal_id, amount, note, occurred_on')
    .order('occurred_on', { ascending: false })
  if (error) throw error
  return (data ?? []).map(mapContribution)
}

export interface SavingsGoalInput {
  name: string
  color: string
  icon: string
  targetAmount: number
}

export async function createSavingsGoal(householdId: string, userId: string, input: SavingsGoalInput): Promise<string> {
  const { data, error } = await supabase
    .from('savings_goals')
    .insert({
      household_id: householdId,
      name: input.name,
      color: input.color,
      icon: input.icon,
      target_amount: input.targetAmount,
      created_by: userId,
    })
    .select('id')
    .single()
  if (error || !data) throw error ?? new Error('Nem sikerült létrehozni a célt')
  return data.id
}

export async function updateSavingsGoal(id: string, input: SavingsGoalInput): Promise<void> {
  const { error } = await supabase
    .from('savings_goals')
    .update({ name: input.name, color: input.color, icon: input.icon, target_amount: input.targetAmount })
    .eq('id', id)
  if (error) throw error
}

export async function deleteSavingsGoal(id: string): Promise<void> {
  const { error } = await supabase.from('savings_goals').delete().eq('id', id)
  if (error) throw error
}

export interface SavingsContributionInput {
  goalId: string
  amount: number
  note?: string
  occurredOn: string
}

export async function createSavingsContribution(
  householdId: string,
  userId: string,
  input: SavingsContributionInput,
): Promise<void> {
  const { error } = await supabase.from('savings_contributions').insert({
    household_id: householdId,
    goal_id: input.goalId,
    amount: input.amount,
    note: input.note ?? null,
    occurred_on: input.occurredOn,
    created_by: userId,
  })
  if (error) throw error
}

export async function deleteSavingsContribution(id: string): Promise<void> {
  const { error } = await supabase.from('savings_contributions').delete().eq('id', id)
  if (error) throw error
}

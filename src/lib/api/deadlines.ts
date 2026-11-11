import { supabase } from '../supabaseClient'
import type { Deadline, Priority, Recurrence } from '../../types'

interface DeadlineRow {
  id: string
  title: string
  description: string | null
  due_date: string
  due_time: string | null
  priority: string
  recurrence: string
  done: boolean
  reminder_offset_minutes: number | null
  deadline_assignees: { member_id: string }[] | null
}

function mapRow(row: DeadlineRow): Deadline {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    dueDate: row.due_date,
    dueTime: row.due_time ? row.due_time.slice(0, 5) : undefined,
    priority: (row.priority as Priority) ?? 'medium',
    recurrence: (row.recurrence as Recurrence) ?? 'none',
    done: row.done,
    reminderOffsetMinutes: row.reminder_offset_minutes ?? undefined,
    assigneeIds: (row.deadline_assignees ?? []).map((a) => a.member_id),
  }
}

export async function fetchDeadlines(): Promise<Deadline[]> {
  const { data, error } = await supabase
    .from('deadlines')
    .select(
      'id, title, description, due_date, due_time, priority, recurrence, done, reminder_offset_minutes, deadline_assignees(member_id)',
    )
    .order('due_date', { ascending: true })
  if (error) throw error
  return (data ?? []).map((row) => mapRow(row as unknown as DeadlineRow))
}

export interface DeadlineInput {
  title: string
  description?: string
  dueDate: string
  dueTime?: string
  priority: Priority
  recurrence: Recurrence
  reminderOffsetMinutes?: number
  assigneeIds: string[]
  viewerIds?: string[]
}

export async function createDeadline(householdId: string, userId: string, input: DeadlineInput): Promise<string> {
  const { data, error } = await supabase
    .from('deadlines')
    .insert({
      household_id: householdId,
      title: input.title,
      description: input.description ?? null,
      due_date: input.dueDate,
      due_time: input.dueTime ?? null,
      priority: input.priority,
      recurrence: input.recurrence,
      reminder_offset_minutes: input.reminderOffsetMinutes ?? null,
      created_by: userId,
    })
    .select('id')
    .single()
  if (error || !data) throw error ?? new Error('Nem sikerült létrehozni a határidőt')

  const deadlineId = data.id

  if (input.assigneeIds.length > 0) {
    const { error: assigneeError } = await supabase
      .from('deadline_assignees')
      .insert(input.assigneeIds.map((memberId) => ({ deadline_id: deadlineId, member_id: memberId })))
    if (assigneeError) throw assigneeError
  }

  if (input.viewerIds && input.viewerIds.length > 0) {
    const { error: viewerError } = await supabase
      .from('deadline_viewers')
      .insert(input.viewerIds.map((memberId) => ({ deadline_id: deadlineId, member_id: memberId })))
    if (viewerError) throw viewerError
  }

  return deadlineId
}

export async function updateDeadline(id: string, input: DeadlineInput): Promise<void> {
  const { error } = await supabase
    .from('deadlines')
    .update({
      title: input.title,
      description: input.description ?? null,
      due_date: input.dueDate,
      due_time: input.dueTime ?? null,
      priority: input.priority,
      recurrence: input.recurrence,
      reminder_offset_minutes: input.reminderOffsetMinutes ?? null,
    })
    .eq('id', id)
  if (error) throw error

  const { error: delErr } = await supabase.from('deadline_assignees').delete().eq('deadline_id', id)
  if (delErr) throw delErr
  if (input.assigneeIds.length > 0) {
    const { error: insErr } = await supabase
      .from('deadline_assignees')
      .insert(input.assigneeIds.map((memberId) => ({ deadline_id: id, member_id: memberId })))
    if (insErr) throw insErr
  }
}

export async function setDeadlineDone(id: string, done: boolean): Promise<void> {
  const { error } = await supabase.from('deadlines').update({ done }).eq('id', id)
  if (error) throw error
}

import { supabase } from '../supabaseClient'
import type { EventItem } from '../../types'

interface EventRow {
  id: string
  title: string
  start_at: string
  end_at: string | null
  location: string | null
  note: string | null
  reminder_offsets: number[]
  event_participants: { member_id: string }[] | null
}

function mapRow(row: EventRow): EventItem {
  return {
    id: row.id,
    title: row.title,
    startAt: row.start_at,
    endAt: row.end_at ?? undefined,
    location: row.location ?? undefined,
    note: row.note ?? undefined,
    reminderOffsets: row.reminder_offsets ?? [],
    participantIds: (row.event_participants ?? []).map((p) => p.member_id),
  }
}

export async function fetchEvents(): Promise<EventItem[]> {
  const { data, error } = await supabase
    .from('events')
    .select('id, title, start_at, end_at, location, note, reminder_offsets, event_participants(member_id)')
    .order('start_at', { ascending: true })
  if (error) throw error
  return (data ?? []).map((row) => mapRow(row as unknown as EventRow))
}

export interface EventInput {
  title: string
  startAt: string
  endAt?: string
  location?: string
  note?: string
  reminderOffsets: number[]
  participantIds: string[]
  viewerIds?: string[]
}

export async function createEvent(householdId: string, userId: string, input: EventInput): Promise<string> {
  const { data, error } = await supabase
    .from('events')
    .insert({
      household_id: householdId,
      title: input.title,
      start_at: input.startAt,
      end_at: input.endAt ?? null,
      location: input.location ?? null,
      note: input.note ?? null,
      reminder_offsets: input.reminderOffsets,
      created_by: userId,
    })
    .select('id')
    .single()
  if (error || !data) throw error ?? new Error('Nem sikerült létrehozni az időpontot')

  const eventId = data.id

  if (input.participantIds.length > 0) {
    const { error: participantError } = await supabase
      .from('event_participants')
      .insert(input.participantIds.map((memberId) => ({ event_id: eventId, member_id: memberId })))
    if (participantError) throw participantError
  }

  if (input.viewerIds && input.viewerIds.length > 0) {
    const { error: viewerError } = await supabase
      .from('event_viewers')
      .insert(input.viewerIds.map((memberId) => ({ event_id: eventId, member_id: memberId })))
    if (viewerError) throw viewerError
  }

  return eventId
}

export async function updateEvent(id: string, input: EventInput): Promise<void> {
  const { error } = await supabase
    .from('events')
    .update({
      title: input.title,
      start_at: input.startAt,
      end_at: input.endAt ?? null,
      location: input.location ?? null,
      note: input.note ?? null,
      reminder_offsets: input.reminderOffsets,
      notified_offsets: [],
    })
    .eq('id', id)
  if (error) throw error

  const { error: delErr } = await supabase.from('event_participants').delete().eq('event_id', id)
  if (delErr) throw delErr
  if (input.participantIds.length > 0) {
    const { error: insErr } = await supabase
      .from('event_participants')
      .insert(input.participantIds.map((memberId) => ({ event_id: id, member_id: memberId })))
    if (insErr) throw insErr
  }
}

// Ütemezve (cron) fut: megnézi, mely határidők/időpontok/számlák esedékessége közeleg,
// és push értesítést küld az érintett háztartás tagjainak + a megosztott extra nézőknek.
// Egy tételhez TÖBB emlékeztető-időpont is tartozhat (reminder_offsets) - mindegyikhez
// külön-külön, csak egyszer küld push-t (notified_offsets tárolja, melyikhez ment már).

import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT')!

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

type TableName = 'deadlines' | 'events' | 'bills'

interface NotifyItem {
  table: TableName
  id: string
  householdId: string
  title: string
  body: string
  viewerTable: string
  viewerColumn: string
}

function shouldNotify(effectiveAt: Date, offsetMinutes: number, now: Date): boolean {
  const triggerAt = new Date(effectiveAt.getTime() - offsetMinutes * 60_000)
  return now >= triggerAt && now < effectiveAt
}

/** A Postgres "time" oszlop HH:MM:SS formátumban jön vissza - ez normalizálja HH:MM-re. */
function normalizeTime(time: string | null, fallback: string): string {
  const t = time ?? fallback
  return t.slice(0, 5)
}

async function sendForItem(item: NotifyItem) {
  const [{ data: members }, { data: viewers }] = await Promise.all([
    supabase.from('household_members').select('id').eq('household_id', item.householdId),
    supabase.from(item.viewerTable).select('member_id').eq(item.viewerColumn, item.id),
  ])

  const memberIds = new Set<string>([
    ...(members ?? []).map((m: { id: string }) => m.id),
    ...(viewers ?? []).map((v: { member_id: string }) => v.member_id),
  ])
  if (memberIds.size === 0) return

  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .in('member_id', [...memberIds])

  const payload = JSON.stringify({ title: item.title, body: item.body, url: '/' })

  await Promise.all(
    (subscriptions ?? []).map(async (sub: { endpoint: string; p256dh: string; auth: string }) => {
      try {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload)
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode
        if (statusCode === 404 || statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
        }
      }
    }),
  )
}

/** Az adott offsetet elküldöttként jelöli, és frissíti a "legutóbb értesítve" időbélyeget. */
async function markOffsetNotified(table: TableName, id: string, notifiedOffsets: number[], offset: number) {
  const next = [...new Set([...notifiedOffsets, offset])]
  await supabase
    .from(table)
    .update({ notified_offsets: next, notified_at: new Date().toISOString() })
    .eq('id', id)
  return next
}

Deno.serve(async () => {
  const now = new Date()
  const sent: string[] = []

  const { data: deadlines } = await supabase
    .from('deadlines')
    .select('id, household_id, title, due_date, due_time, reminder_offsets, notified_offsets')
    .eq('done', false)

  for (const d of deadlines ?? []) {
    let notified = d.notified_offsets ?? []
    const effectiveAt = new Date(`${d.due_date}T${normalizeTime(d.due_time, '09:00')}:00`)
    for (const offset of d.reminder_offsets ?? []) {
      if (notified.includes(offset)) continue
      if (shouldNotify(effectiveAt, offset, now)) {
        await sendForItem({
          table: 'deadlines',
          id: d.id,
          householdId: d.household_id,
          title: 'Határidő közeleg',
          body: d.title,
          viewerTable: 'deadline_viewers',
          viewerColumn: 'deadline_id',
        })
        notified = await markOffsetNotified('deadlines', d.id, notified, offset)
        sent.push(`deadline:${d.id}:${offset}`)
      }
    }
  }

  const { data: events } = await supabase
    .from('events')
    .select('id, household_id, title, start_at, reminder_offsets, notified_offsets')

  for (const e of events ?? []) {
    let notified = e.notified_offsets ?? []
    const effectiveAt = new Date(e.start_at)
    for (const offset of e.reminder_offsets ?? []) {
      if (notified.includes(offset)) continue
      if (shouldNotify(effectiveAt, offset, now)) {
        await sendForItem({
          table: 'events',
          id: e.id,
          householdId: e.household_id,
          title: 'Közelgő időpont',
          body: e.title,
          viewerTable: 'event_viewers',
          viewerColumn: 'event_id',
        })
        notified = await markOffsetNotified('events', e.id, notified, offset)
        sent.push(`event:${e.id}:${offset}`)
      }
    }
  }

  const { data: bills } = await supabase
    .from('bills')
    .select('id, household_id, issuer, amount, due_date, reminder_offsets, notified_offsets')
    .eq('status', 'pending')

  for (const b of bills ?? []) {
    let notified = b.notified_offsets ?? []
    const effectiveAt = new Date(`${b.due_date}T09:00:00`)
    for (const offset of b.reminder_offsets ?? []) {
      if (notified.includes(offset)) continue
      if (shouldNotify(effectiveAt, offset, now)) {
        await sendForItem({
          table: 'bills',
          id: b.id,
          householdId: b.household_id,
          title: 'Esedékes számla',
          body: `${b.issuer} - ${b.amount} Ft`,
          viewerTable: 'bill_viewers',
          viewerColumn: 'bill_id',
        })
        notified = await markOffsetNotified('bills', b.id, notified, offset)
        sent.push(`bill:${b.id}:${offset}`)
      }
    }
  }

  return new Response(JSON.stringify({ sent }), { headers: { 'Content-Type': 'application/json' } })
})

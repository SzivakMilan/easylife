// Naponta egyszer (cron) lefut: háztartásonként összefoglaló push értesítést
// küld arról, mi esedékes aznapra (határidők, időpontok, számlák). Nem a
// konkrét tételek emlékeztetőit helyettesíti (azt a send-reminders végzi),
// hanem egy "mi vár ma rád" reggeli összefoglaló.
import { createAdminClient, sendPushToMembers } from '../_shared/push.ts'

const supabase = createAdminClient()

function todayRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000)
  const todayStr = start.toISOString().slice(0, 10)
  return { start, end, todayStr }
}

Deno.serve(async () => {
  const { start, end, todayStr } = todayRange()
  const sent: string[] = []

  const { data: households } = await supabase.from('households').select('id')

  for (const h of households ?? []) {
    const [{ data: deadlines }, { data: events }, { data: bills }] = await Promise.all([
      supabase
        .from('deadlines')
        .select('title')
        .eq('household_id', h.id)
        .eq('done', false)
        .eq('due_date', todayStr),
      supabase
        .from('events')
        .select('title, start_at')
        .eq('household_id', h.id)
        .gte('start_at', start.toISOString())
        .lt('start_at', end.toISOString()),
      supabase
        .from('bills')
        .select('issuer, amount')
        .eq('household_id', h.id)
        .eq('status', 'pending')
        .eq('due_date', todayStr),
    ])

    const parts: string[] = [
      ...(deadlines ?? []).map((d: { title: string }) => `Határidő: ${d.title}`),
      ...(events ?? []).map((e: { title: string }) => `Időpont: ${e.title}`),
      ...(bills ?? []).map((b: { issuer: string; amount: number }) => `Számla: ${b.issuer} (${b.amount} Ft)`),
    ]

    if (parts.length === 0) continue

    const shown = parts.slice(0, 3)
    const extra = parts.length - shown.length
    const body = shown.join(' · ') + (extra > 0 ? ` · +${extra} további` : '')

    const { data: members } = await supabase.from('household_members').select('id').eq('household_id', h.id)
    const memberIds = (members ?? []).map((m: { id: string }) => m.id)

    await sendPushToMembers(supabase, memberIds, { title: 'Mai napra', body })
    sent.push(`household:${h.id}`)
  }

  return new Response(JSON.stringify({ sent }), { headers: { 'Content-Type': 'application/json' } })
})

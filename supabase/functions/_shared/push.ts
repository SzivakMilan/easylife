// Megosztott push-küldő segédfüggvény a send-reminders és a notify-new-item
// Edge Function-ök között.
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

webpush.setVapidDetails(
  Deno.env.get('VAPID_SUBJECT')!,
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!,
)

export function createAdminClient(): SupabaseClient {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
}

export async function sendPushToMembers(
  supabase: SupabaseClient,
  memberIds: Iterable<string>,
  payload: { title: string; body: string; url?: string },
): Promise<void> {
  const ids = [...new Set(memberIds)]
  if (ids.length === 0) return

  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .in('member_id', ids)

  const json = JSON.stringify({ title: payload.title, body: payload.body, url: payload.url ?? '/' })

  await Promise.all(
    (subscriptions ?? []).map(async (sub: { endpoint: string; p256dh: string; auth: string }) => {
      try {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, json)
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode
        if (statusCode === 404 || statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
        }
      }
    }),
  )
}

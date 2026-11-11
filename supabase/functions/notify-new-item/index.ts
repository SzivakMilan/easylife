// A kliens hívja meg közvetlenül egy új határidő/időpont/számla létrehozása után:
// azonnal (nem a 15 perces cronra várva) push értesítést küld a háztartás
// tagjainak és a tétel extra nézőinek, hogy "X felvett egy új ...-t".
import { createClient } from 'npm:@supabase/supabase-js@2'
import { createAdminClient, sendPushToMembers } from '../_shared/push.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!

type TableName = 'deadlines' | 'events' | 'bills'

const TABLE_META: Record<
  TableName,
  { label: string; titleColumn: string; viewerTable: string; viewerColumn: string }
> = {
  deadlines: { label: 'határidőt', titleColumn: 'title', viewerTable: 'deadline_viewers', viewerColumn: 'deadline_id' },
  events: { label: 'időpontot', titleColumn: 'title', viewerTable: 'event_viewers', viewerColumn: 'event_id' },
  bills: { label: 'számlát', titleColumn: 'issuer', viewerTable: 'bill_viewers', viewerColumn: 'bill_id' },
}

Deno.serve(async (req) => {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return new Response('Unauthorized', { status: 401 })

  let body: { table?: TableName; id?: string }
  try {
    body = await req.json()
  } catch {
    return new Response('Bad request', { status: 400 })
  }

  const { table, id } = body
  const meta = table ? TABLE_META[table] : undefined
  if (!meta || !id) return new Response('Bad request', { status: 400 })

  // A hívó saját jogosultságával (RLS) kérdezzük le a tételt - ha nem fér
  // hozzá (nem a saját háztartásáé), itt elbukik, és nem jutunk tovább.
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: item, error } = await userClient
    .from(table!)
    .select(`id, household_id, created_by, ${meta.titleColumn}`)
    .eq('id', id)
    .single()
  if (error || !item) return new Response('Not found', { status: 404 })

  const admin = createAdminClient()

  const [{ data: members }, { data: viewers }, { data: creatorMember }] = await Promise.all([
    admin.from('household_members').select('id').eq('household_id', item.household_id),
    admin.from(meta.viewerTable).select('member_id').eq(meta.viewerColumn, id),
    admin
      .from('household_members')
      .select('id, display_name')
      .eq('user_id', item.created_by)
      .eq('household_id', item.household_id)
      .maybeSingle(),
  ])

  const memberIds = new Set<string>([
    ...(members ?? []).map((m: { id: string }) => m.id),
    ...(viewers ?? []).map((v: { member_id: string }) => v.member_id),
  ])
  if (creatorMember) memberIds.delete(creatorMember.id)

  const itemTitle = (item as Record<string, unknown>)[meta.titleColumn] as string
  await sendPushToMembers(admin, memberIds, {
    title: 'Új tétel',
    body: `${creatorMember?.display_name ?? 'Valaki'} felvett egy új ${meta.label}: ${itemTitle}`,
  })

  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } })
})

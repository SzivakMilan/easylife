// Naponta egyszer (cron) lefut: lekéri a Telex RSS feedjét, és minden
// cikket (cím, link, kategória, megjelenés dátuma) eltárol/frissít a
// news_articles táblában. A Hírek oldal ebből a táblából szűr a felhasználó
// választott kategóriái szerint - ez a függvény csak feltölti a közös
// gyorsítótárat, nem tud semmit a háztartásokról/tagokról.
import { XMLParser } from 'npm:fast-xml-parser@4.5.0'
import { createAdminClient } from '../_shared/push.ts'

const FEED_URL = 'https://telex.hu/rss'
const SOURCE = 'telex'
const MAX_AGE_DAYS = 14

const supabase = createAdminClient()

interface FeedItem {
  title?: string
  link?: string
  category?: string
  pubDate?: string
}

Deno.serve(async () => {
  const res = await fetch(FEED_URL, {
    headers: { 'User-Agent': 'OtthonApp-fetch-news/1.0' },
  })
  if (!res.ok) return new Response(`Feed fetch failed: ${res.status}`, { status: 502 })
  const xml = await res.text()

  const parser = new XMLParser({ isArray: (name) => name === 'item' })
  const parsed = parser.parse(xml) as { rss?: { channel?: { item?: FeedItem[] } } }
  const items = parsed.rss?.channel?.item ?? []

  const rows = items
    .filter((item) => item.title && item.link && item.category && item.pubDate)
    .map((item) => ({
      source: SOURCE,
      category: String(item.category),
      title: String(item.title),
      link: String(item.link),
      published_at: new Date(item.pubDate!).toISOString(),
    }))

  if (rows.length > 0) {
    const { error } = await supabase.from('news_articles').upsert(rows, { onConflict: 'source,link' })
    if (error) return new Response(`Upsert failed: ${error.message}`, { status: 500 })
  }

  const cutoff = new Date(Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000).toISOString()
  await supabase.from('news_articles').delete().lt('published_at', cutoff)

  return new Response(JSON.stringify({ source: SOURCE, upserted: rows.length }), {
    headers: { 'Content-Type': 'application/json' },
  })
})

// Naponta egyszer (cron) lefut: lekéri az alábbi RSS feedeket, és minden
// cikket (cím, link, kategória, megjelenés dátuma) eltárol/frissít a
// news_articles táblában. A Hírek oldal ebből a táblából szűr a felhasználó
// választott kategóriái szerint - ez a függvény csak feltölti a közös
// gyorsítótárat, nem tud semmit a háztartásokról/tagokról.
//
// Új forrás hozzáadásakor elég egy sort felvenni a FEEDS listába - a
// kategóriát minden forrásnál magából a feedből (az item <category> tagjéből)
// olvassuk, nincs forrásonkénti külön eset.
import { XMLParser } from 'npm:fast-xml-parser@4.5.0'
import { createAdminClient } from '../_shared/push.ts'

const FEEDS: { source: string; url: string }[] = [
  { source: 'telex', url: 'https://telex.hu/rss' },
  // Általános Portfolio.hu feed (Gazdaság, Globál, Üzlet, Befektetés, ...).
  { source: 'portfolio', url: 'https://www.portfolio.hu/rss/all.xml' },
  // Külön befektetés/tőzsde feed, hogy ez a téma biztosan jól fel legyen töltve.
  { source: 'portfolio', url: 'https://www.portfolio.hu/rss/befektetes.xml' },
]
const MAX_AGE_DAYS = 14

const supabase = createAdminClient()

interface FeedItem {
  title?: string
  link?: string
  category?: string
  pubDate?: string
}

interface NewsRow {
  source: string
  category: string
  title: string
  link: string
  published_at: string
}

async function fetchFeed(source: string, url: string): Promise<NewsRow[]> {
  const res = await fetch(url, { headers: { 'User-Agent': 'OtthonApp-fetch-news/1.0' } })
  if (!res.ok) throw new Error(`${source} feed fetch failed: ${res.status}`)
  const xml = await res.text()

  const parser = new XMLParser({ isArray: (name) => name === 'item' })
  const parsed = parser.parse(xml) as { rss?: { channel?: { item?: FeedItem[] } } }
  const items = parsed.rss?.channel?.item ?? []

  return items
    .filter((item) => item.title && item.link && item.category && item.pubDate)
    .map((item) => ({
      source,
      category: String(item.category),
      title: String(item.title),
      link: String(item.link),
      published_at: new Date(item.pubDate!).toISOString(),
    }))
}

Deno.serve(async () => {
  const results = await Promise.allSettled(FEEDS.map((feed) => fetchFeed(feed.source, feed.url)))

  const rows: NewsRow[] = []
  const failed: string[] = []
  results.forEach((result, i) => {
    if (result.status === 'fulfilled') rows.push(...result.value)
    else failed.push(`${FEEDS[i].source} (${FEEDS[i].url}): ${result.reason}`)
  })

  // Ugyanaz a cikk több feedben is szerepelhet (pl. a Portfolio általános és
  // befektetés-feedje átfedhet) - egy upsert-hívás nem érintheti kétszer
  // ugyanazt a sort, ezért (source, link) szerint dedupláljuk.
  const dedupedRows = [...new Map(rows.map((row) => [`${row.source}|${row.link}`, row])).values()]

  if (dedupedRows.length > 0) {
    const { error } = await supabase.from('news_articles').upsert(dedupedRows, { onConflict: 'source,link' })
    if (error) return new Response(`Upsert failed: ${error.message}`, { status: 500 })
  }

  const cutoff = new Date(Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000).toISOString()
  await supabase.from('news_articles').delete().lt('published_at', cutoff)

  return new Response(JSON.stringify({ upserted: dedupedRows.length, failedFeeds: failed }), {
    headers: { 'Content-Type': 'application/json' },
  })
})

// Ingyenes, kulcs nélküli program-ötletek/látványosságok egy úti célhoz, az
// angol Wikivoyage publikus API-jából (CORS-engedélyezett, közvetlenül
// hívható a böngészőből - nincs szükség backendre). Minden cikk "See" és
// "Do" szekciója a Wikivoyage "listing" mikroformátumában van
// (.listing-name/.listing-address stb.), ezt DOM-parszoljuk.

export interface WikivoyageListing {
  name: string
  address?: string
  description?: string
}

export interface WikivoyageResult {
  title: string
  pageUrl: string
  see: WikivoyageListing[]
  do: WikivoyageListing[]
}

const API_BASE = 'https://en.wikivoyage.org/w/api.php'

async function apiGet(params: Record<string, string>): Promise<Record<string, unknown>> {
  const url = `${API_BASE}?${new URLSearchParams({ ...params, format: 'json', origin: '*' })}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Wikivoyage API hiba: ${res.status}`)
  return res.json()
}

async function resolveTitle(destination: string): Promise<string | null> {
  const trimmed = destination.trim()
  if (!trimmed) return null

  const queryData = await apiGet({ action: 'query', titles: trimmed, redirects: '1' })
  const pages = ((queryData.query as Record<string, unknown> | undefined)?.pages ?? {}) as Record<
    string,
    { missing?: unknown; title?: string }
  >
  const page = Object.values(pages)[0]
  if (page && !('missing' in page) && page.title) return page.title

  const searchData = await apiGet({ action: 'query', list: 'search', srsearch: trimmed, srlimit: '1' })
  const hits = ((searchData.query as Record<string, unknown> | undefined)?.search ?? []) as { title?: string }[]
  return hits[0]?.title ?? null
}

interface SectionInfo {
  index: string
  line: string
}

async function findSectionIndexes(title: string): Promise<{ see?: string; do?: string }> {
  const data = await apiGet({ action: 'parse', page: title, prop: 'sections' })
  const sections = ((data.parse as Record<string, unknown> | undefined)?.sections ?? []) as SectionInfo[]
  return {
    see: sections.find((s) => s.line === 'See')?.index,
    do: sections.find((s) => s.line === 'Do')?.index,
  }
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength).trimEnd()}…`
}

function extractListings(html: string): WikivoyageListing[] {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const listings: WikivoyageListing[] = []

  for (const li of Array.from(doc.querySelectorAll('li'))) {
    const nameEl = li.querySelector('.listing-name')
    const name = nameEl?.textContent?.trim()
    if (!name) continue

    const address = li.querySelector('.listing-address')?.textContent?.trim() || undefined

    const clone = li.cloneNode(true) as HTMLElement
    clone
      .querySelectorAll('style, .listing-coordinates, .listing-name, .listing-address, .listing-directions, .noprint')
      .forEach((el) => el.remove())
    const rawDescription = clone.textContent?.replace(/\s+/g, ' ').trim().replace(/^[,.\s()]+/, '')
    const description = rawDescription ? truncate(rawDescription, 180) : undefined

    listings.push({ name, address, description })
  }

  return listings.slice(0, 12)
}

async function fetchSectionListings(title: string, sectionIndex: string): Promise<WikivoyageListing[]> {
  const data = await apiGet({ action: 'parse', page: title, section: sectionIndex, prop: 'text' })
  const html = ((data.parse as Record<string, unknown> | undefined)?.text as Record<string, string> | undefined)?.['*']
  return html ? extractListings(html) : []
}

/** `null` = nincs ilyen úti cél a Wikivoyage-on; üres see/do = van cikk, de nincs benne feldolgozható lista. */
export async function fetchDestinationIdeas(destination: string): Promise<WikivoyageResult | null> {
  const title = await resolveTitle(destination)
  if (!title) return null

  const { see, do: doIndex } = await findSectionIndexes(title)
  const [seeListings, doListings] = await Promise.all([
    see ? fetchSectionListings(title, see) : Promise.resolve([]),
    doIndex ? fetchSectionListings(title, doIndex) : Promise.resolve([]),
  ])

  return {
    title,
    pageUrl: `https://en.wikivoyage.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`,
    see: seeListings,
    do: doListings,
  }
}

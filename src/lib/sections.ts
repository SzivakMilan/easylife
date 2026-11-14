import type { SectionKey } from '../types'

export interface SectionMeta {
  key: SectionKey
  label: string
  path: string
  icon: string
}

export const SECTIONS: SectionMeta[] = [
  { key: 'home', label: 'Kezdőlap', path: '/', icon: 'home' },
  { key: 'deadlines', label: 'Határidők', path: '/hataridok', icon: 'flag' },
  { key: 'events', label: 'Időpontok', path: '/idopontok', icon: 'calendar' },
  { key: 'budget', label: 'Költségvetés', path: '/koltsegvetes', icon: 'wallet' },
  { key: 'bills', label: 'Számlák', path: '/szamlak', icon: 'receipt' },
  { key: 'shopping', label: 'Bevásárlás', path: '/bevasarlas', icon: 'cart' },
  { key: 'health', label: 'Egészség', path: '/egeszseg', icon: 'heart' },
  { key: 'news', label: 'Hírek', path: '/hirek', icon: 'newspaper' },
  { key: 'family', label: 'Családtagok', path: '/csaladtagok', icon: 'users' },
  { key: 'settings', label: 'Beállítások', path: '/beallitasok', icon: 'settings' },
]

export function sectionByPath(pathname: string): SectionMeta {
  const match = SECTIONS.find((s) =>
    s.path === '/' ? pathname === '/' : pathname.startsWith(s.path),
  )
  return match ?? SECTIONS[0]
}

export function sectionIndex(key: SectionKey): number {
  return SECTIONS.findIndex((s) => s.key === key)
}

/** A `dir` szomszédos szekció (-1 = előző, 1 = következő), vagy null a lista szélén. */
export function adjacentSection(key: SectionKey, dir: 1 | -1): SectionMeta | null {
  const idx = sectionIndex(key)
  const nextIdx = idx + dir
  if (idx === -1 || nextIdx < 0 || nextIdx >= SECTIONS.length) return null
  return SECTIONS[nextIdx]
}

export const TYPE_META: Record<'deadline' | 'event' | 'bill', { icon: string; accent: string; section: SectionKey }> = {
  deadline: { icon: 'flag', accent: 'var(--section-deadlines-accent)', section: 'deadlines' },
  event: { icon: 'calendar', accent: 'var(--section-events-accent)', section: 'events' },
  bill: { icon: 'receipt', accent: 'var(--section-bills-accent)', section: 'bills' },
}

export const SECTION_GRADIENTS: Record<SectionKey, { accent: string }> = {
  home: { accent: 'var(--section-home-accent)' },
  deadlines: { accent: 'var(--section-deadlines-accent)' },
  events: { accent: 'var(--section-events-accent)' },
  budget: { accent: 'var(--section-budget-accent)' },
  bills: { accent: 'var(--section-bills-accent)' },
  shopping: { accent: 'var(--section-shopping-accent)' },
  health: { accent: 'var(--section-health-accent)' },
  news: { accent: 'var(--section-news-accent)' },
  family: { accent: 'var(--section-family-accent)' },
  settings: { accent: 'var(--section-settings-accent)' },
}

/** Élénk, a felcsúszó lapokéval megegyező színezésű teljes oldal háttér-gradiens. */
export function sectionPageGradient(accent: string): string {
  return `linear-gradient(180deg, color-mix(in srgb, ${accent} 78%, #050505) 0%, color-mix(in srgb, ${accent} 30%, #050505) 35%, #050505 70%)`
}

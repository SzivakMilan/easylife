import { useMemo, useState } from 'react'
import { Card } from '../../components/ui/Card'
import { BottomSheet } from '../../components/ui/BottomSheet'
import { formatGroupHeader, formatTime, parseDate } from '../../lib/dateUtils'
import { useNews } from './NewsContext'
import type { NewsArticle } from '../../types'

export function NewsPage() {
  const { articles, interests, availableCategories, toggleInterest } = useNews()
  const [editingInterests, setEditingInterests] = useState(false)

  const groups = useMemo(() => groupByDate(articles), [articles])

  return (
    <div className="flex flex-col gap-4 px-4 pb-28 pt-2">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-[20px] font-bold text-white">Hírek</h2>
        {interests.length > 0 && (
          <button onClick={() => setEditingInterests(true)} className="text-[14px] font-medium text-white/60">
            Témák szerkesztése
          </button>
        )}
      </div>

      {interests.length === 0 ? (
        <Card className="flex flex-col gap-3 p-5">
          <p className="text-[15px] text-white/70">Válaszd ki, mely témák érdekelnek - ezekből mutatjuk a híreket.</p>
          <InterestPicker availableCategories={availableCategories} interests={interests} onToggle={toggleInterest} />
        </Card>
      ) : groups.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 p-6 text-center">
          <p className="text-[15px] text-white/60">Még nincs lekért hír a választott témákban.</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {groups.map(([date, items]) => (
            <div key={date}>
              <h3 className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-wide text-white/40">
                {formatGroupHeader(parseDate(date))}
              </h3>
              <Card className="overflow-hidden">
                {items.map((article) => (
                  <ArticleRow key={article.id} article={article} />
                ))}
              </Card>
            </div>
          ))}
        </div>
      )}

      <BottomSheet open={editingInterests} onClose={() => setEditingInterests(false)}>
        <h2 className="mb-4 text-center text-[17px] font-bold text-white">Témák szerkesztése</h2>
        <InterestPicker availableCategories={availableCategories} interests={interests} onToggle={toggleInterest} />
      </BottomSheet>
    </div>
  )
}

function InterestPicker({
  availableCategories,
  interests,
  onToggle,
}: {
  availableCategories: string[]
  interests: string[]
  onToggle: (category: string) => Promise<void>
}) {
  if (availableCategories.length === 0) {
    return <p className="text-[14px] text-white/50">Még nincs lekért hír - nézz vissza később.</p>
  }
  return (
    <div className="flex flex-wrap gap-2">
      {availableCategories.map((category) => (
        <button
          key={category}
          type="button"
          onClick={() => onToggle(category)}
          className={`rounded-pill border px-3 py-1.5 text-[13px] font-medium ${
            interests.includes(category)
              ? 'border-[var(--accent)] bg-[var(--accent)] text-black'
              : 'border-white/15 bg-white/5 text-white/80'
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  )
}

function ArticleRow({ article }: { article: NewsArticle }) {
  const date = parseDate(article.publishedAt)
  return (
    <a
      href={article.link}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col gap-1 border-t border-white/8 px-4 py-3.5 first:border-t-0 active:bg-white/5"
    >
      <span className="flex items-center gap-2">
        <span className="rounded-pill bg-[var(--accent)]/20 px-2 py-0.5 text-[11px] font-semibold text-[var(--accent)]">
          {article.category}
        </span>
        <span className="text-[12px] text-white/40">
          {article.source} · {formatTime(date)}
        </span>
      </span>
      <span className="text-[15px] font-medium text-white">{article.title}</span>
    </a>
  )
}

function groupByDate(articles: NewsArticle[]): [string, NewsArticle[]][] {
  const map = new Map<string, NewsArticle[]>()
  for (const article of articles) {
    const date = article.publishedAt.slice(0, 10)
    const list = map.get(date) ?? []
    list.push(article)
    map.set(date, list)
  }
  return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a))
}

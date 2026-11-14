import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  addInterest,
  fetchArticles,
  fetchAvailableCategories,
  fetchMyInterests,
  removeInterest,
} from '../../lib/api/news'
import { useHousehold } from '../household/HouseholdContext'
import type { NewsArticle } from '../../types'

interface NewsContextValue {
  articles: NewsArticle[]
  interests: string[]
  availableCategories: string[]
  loading: boolean
  refresh: () => Promise<void>
  toggleInterest: (category: string) => Promise<void>
}

const NewsContext = createContext<NewsContextValue | null>(null)

export function NewsProvider({ children }: { children: ReactNode }) {
  const { myMember } = useHousehold()
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [interests, setInterests] = useState<string[]>([])
  const [availableCategories, setAvailableCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!myMember) {
      setArticles([])
      setInterests([])
      setAvailableCategories([])
      setLoading(false)
      return
    }
    setLoading(true)
    const [myInterests, categories] = await Promise.all([fetchMyInterests(myMember.id), fetchAvailableCategories()])
    setInterests(myInterests)
    setAvailableCategories(categories)
    setArticles(await fetchArticles(myInterests))
    setLoading(false)
  }, [myMember])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function toggleInterest(category: string) {
    if (!myMember) return
    if (interests.includes(category)) {
      await removeInterest(myMember.id, category)
    } else {
      await addInterest(myMember.id, category)
    }
    await refresh()
  }

  return (
    <NewsContext.Provider value={{ articles, interests, availableCategories, loading, refresh, toggleInterest }}>
      {children}
    </NewsContext.Provider>
  )
}

export function useNews() {
  const ctx = useContext(NewsContext)
  if (!ctx) throw new Error('useNews must be used within NewsProvider')
  return ctx
}

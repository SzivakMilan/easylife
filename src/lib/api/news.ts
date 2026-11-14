import { supabase } from '../supabaseClient'
import type { NewsArticle } from '../../types'

interface NewsArticleRow {
  id: string
  source: string
  category: string
  title: string
  link: string
  published_at: string
}

function mapRow(row: NewsArticleRow): NewsArticle {
  return {
    id: row.id,
    source: row.source,
    category: row.category,
    title: row.title,
    link: row.link,
    publishedAt: row.published_at,
  }
}

export async function fetchAvailableCategories(): Promise<string[]> {
  const { data, error } = await supabase.from('news_articles').select('category')
  if (error) throw error
  return Array.from(new Set((data ?? []).map((row) => row.category))).sort()
}

export async function fetchArticles(categories: string[]): Promise<NewsArticle[]> {
  if (categories.length === 0) return []
  const { data, error } = await supabase
    .from('news_articles')
    .select('id, source, category, title, link, published_at')
    .in('category', categories)
    .order('published_at', { ascending: false })
    .limit(100)
  if (error) throw error
  return (data ?? []).map(mapRow)
}

export async function fetchMyInterests(memberId: string): Promise<string[]> {
  const { data, error } = await supabase.from('member_news_interests').select('category').eq('member_id', memberId)
  if (error) throw error
  return (data ?? []).map((row) => row.category)
}

export async function addInterest(memberId: string, category: string): Promise<void> {
  const { error } = await supabase.from('member_news_interests').insert({ member_id: memberId, category })
  if (error) throw error
}

export async function removeInterest(memberId: string, category: string): Promise<void> {
  const { error } = await supabase
    .from('member_news_interests')
    .delete()
    .eq('member_id', memberId)
    .eq('category', category)
  if (error) throw error
}

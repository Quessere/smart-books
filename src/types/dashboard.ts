export interface RankingItem {
  id: string
  name: string
  value: number
  color?: string
}

export interface StatisticItem {
  id: string
  label: string
  value: number
  unit: string
  note: string
  italic?: boolean
}

export interface MediaItem {
  id: string
  src: string
  alt: string
  caption?: string
  kind?: 'image' | 'video'
  fit?: 'cover' | 'contain'
}

export interface NewBookItem {
  id: string
  title: string
  author: string
  publisher: string
  callNumber: string
  date: string
}

export interface NoticeItem {
  id: string
  content: string
}

export interface HeaderContent {
  title: string
  subtitle: string
  logo: MediaItem
  weather: { temperature: number; description: string; airQuality: string }
}

export interface DashboardContent {
  header: HeaderContent
  books: { title: string; unit: string; items: RankingItem[]; limit?: number }
  readers: { title: string; unit: string; items: RankingItem[]; limit?: number }
  statistics: { title: string; items: StatisticItem[] }
  hero: MediaItem
  heroSlides?: MediaItem[]
  heroInterval?: number
  activity: { title: string; image: MediaItem; slides?: MediaItem[]; interval?: number }
  searches: { title: string; items: RankingItem[]; limit?: number }
  newBooks: { title: string; image: MediaItem; mode?: 'image' | 'list'; items?: NewBookItem[] }
  notices: { title: string; background: MediaItem; items: NoticeItem[]; interval?: number; fontSize?: number }
}

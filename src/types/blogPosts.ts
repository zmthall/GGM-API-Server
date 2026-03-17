export type BlogPostOrderField =
  | 'created_at'
  | 'updated_at'
  | 'publish_timestamp'
  | 'title'
  | 'read_time'

export interface PaginationOptions {
  page?: number
  pageSize?: number
  orderField?: BlogPostOrderField
  orderDirection?: 'asc' | 'desc'
}

export interface PaginationMeta {
  currentPage: number
  pageSize: number
  hasNextPage: boolean
  hasPreviousPage: boolean
  totalPages?: number
  totalItems?: number
}

export interface PaginatedResult<T> {
  data: T[]
  pagination: PaginationMeta
}

export interface BlogPostRecord {
  id: string
  slug: string
  title: string
  summary: string
  content: string
  author: string
  tags: string[]
  thumbnail: string
  thumbnail_alt: string
  thumbnail_width: number | null
  thumbnail_height: number | null
  staff_pick: boolean
  featured: boolean
  read_time: number
  draft: boolean
  published: boolean
  publish_timestamp: Date | null
  seo_title: string
  seo_description: string
  seo_image: string
  canonical_url: string
  created_at: Date
  updated_at: Date
}

export interface CreateBlogPostInput {
  id: string
  slug: string
  title: string
  summary: string
  content: string
  author?: string
  tags?: string[]
  thumbnail?: string
  thumbnailAlt?: string
  thumbnailWidth?: number | null
  thumbnailHeight?: number | null
  staffPick?: boolean
  featured?: boolean
  readTime: number
  draft?: boolean
  published?: boolean
  publishTimestamp?: Date | null
  seoTitle?: string
  seoDescription?: string
  seoImage?: string
  canonicalUrl?: string
}

export interface UpdateBlogPostInput {
  slug?: string
  title?: string
  summary?: string
  content?: string
  author?: string
  tags?: string[]
  thumbnail?: string
  thumbnailAlt?: string
  thumbnailWidth?: number | null
  thumbnailHeight?: number | null
  staffPick?: boolean
  featured?: boolean
  readTime?: number
  draft?: boolean
  published?: boolean
  publishTimestamp?: Date | null
  seoTitle?: string
  seoDescription?: string
  seoImage?: string
  canonicalUrl?: string
}

export interface ListBlogPostsOptions extends PaginationOptions {
  publishedOnly?: boolean
  draftOnly?: boolean
  featuredOnly?: boolean
  staffPickOnly?: boolean
  tag?: string
  author?: string
  search?: string
  createdAfter?: Date
  createdBefore?: Date
  publishedAfter?: Date
  publishedBefore?: Date
}
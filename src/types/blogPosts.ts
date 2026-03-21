export type BlogPostOrderField =
  | 'created_at'
  | 'updated_at'
  | 'publish_timestamp'
  | 'title'
  | 'read_time'

export type BlogPostSelectPreset =
  | 'full'
  | 'card'
  | 'preview'
  | 'slugOnly'
  | 'seo'
  | 'tiny'

export interface PaginationOptions {
  page?: number
  pageSize?: number
  orderField?: BlogPostOrderField
  orderDirection?: 'asc' | 'desc'
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
  limit?: number
  select?: BlogPostSelectPreset
}

export interface RelatedBlogPostsQueryInput {
  id: string
  title: string
  summary: string
  author: string
  tags: string[]
}

export interface BlogPostFullRecord {
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

export interface BlogPostCardRecord {
  id: string
  slug: string
  title: string
  summary: string
  tags: string[]
  thumbnail: string
  thumbnail_alt: string
  thumbnail_width: number | null
  thumbnail_height: number | null
  featured: boolean
  staff_pick: boolean
  read_time: number
  publish_timestamp: Date | null
}

export interface BlogPostPreviewRecord {
  id: string
  slug: string
  title: string
  thumbnail: string
  thumbnail_alt: string
  thumbnail_width: number | null
  thumbnail_height: number | null
  published: boolean
  publish_timestamp: Date | null
  draft: boolean
  updated_at: Date
}

export interface BlogPostSeoRecord {
  id: string
  slug: string
  title: string
  summary: string
  seo_title: string
  seo_description: string
  seo_image: string
  canonical_url: string
  publish_timestamp: Date | null
}

export interface BlogPostUpdateRecord {
  id: string
  created_at: Date
  slug: string
  canonical_url: string
  published: boolean
  publish_timestamp: Date | null
  draft: boolean
  updated_at: Date
}

export interface BlogPostTinyRecord {
  id: string
  slug: string
  title: string
  summary: string
}

export interface BlogPostSlugRecord {
  slug: string
}

export type BlogPostRecord = BlogPostFullRecord

export interface PaginatedResult<T> {
  data: T[]
  pagination: {
    currentPage: number
    pageSize: number
    hasNextPage: boolean
    hasPreviousPage: boolean
    totalPages: number
    totalItems: number
  }
}

export interface BlogImageUploadResult {
  path: string
  width: number | null
  height: number | null
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

export interface BlogPostExistsResult {
  exists: boolean
}

export interface SlugExistsResult {
  exists: boolean
}
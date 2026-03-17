import { postgresPool } from '../../../config/postgres'
import {
  toSafeBoolean,
  toSafeDate,
  toSafeNullableDate,
  toSafeString,
  toSafeStringArray
} from '../../safe'

const TABLE_NAME = 'blog_posts'

const PUBLIC_BLOG_POSTS_WHERE = `
  draft = false
  and published = true
  and (
    publish_timestamp is null
    or publish_timestamp <= now()
  )
`

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

const mapRow = (row: Record<string, unknown>): BlogPostRecord => {
  return {
    id: toSafeString(row.id),
    slug: toSafeString(row.slug),
    title: toSafeString(row.title),
    summary: toSafeString(row.summary),
    content: toSafeString(row.content),
    author: toSafeString(row.author),
    tags: toSafeStringArray(row.tags),
    thumbnail: toSafeString(row.thumbnail),
    thumbnail_alt: toSafeString(row.thumbnail_alt),
    thumbnail_width: row.thumbnail_width == null ? null : Number(row.thumbnail_width),
    thumbnail_height: row.thumbnail_height == null ? null : Number(row.thumbnail_height),
    staff_pick: toSafeBoolean(row.staff_pick),
    featured: toSafeBoolean(row.featured),
    read_time: Number(row.read_time ?? 0),
    draft: toSafeBoolean(row.draft),
    published: toSafeBoolean(row.published),
    publish_timestamp: row.publish_timestamp
      ? toSafeNullableDate(row.publish_timestamp as Date)
      : null,
    seo_title: toSafeString(row.seo_title),
    seo_description: toSafeString(row.seo_description),
    seo_image: toSafeString(row.seo_image),
    canonical_url: toSafeString(row.canonical_url),
    created_at: toSafeDate(row.created_at),
    updated_at: toSafeDate(row.updated_at)
  }
}

const ORDER_FIELD_MAP: Record<BlogPostOrderField, string> = {
  created_at: 'created_at',
  updated_at: 'updated_at',
  publish_timestamp: 'publish_timestamp',
  title: 'title',
  read_time: 'read_time'
}

const buildOrderByClause = (
  field?: BlogPostOrderField,
  direction?: 'asc' | 'desc'
): string => {
  const orderField = ORDER_FIELD_MAP[field ?? 'publish_timestamp']
  const orderDirection = direction === 'asc' ? 'asc' : 'desc'

  return `order by ${orderField} ${orderDirection} nulls last, created_at desc`
}

const buildWhereClause = (
  options: ListBlogPostsOptions = {},
  startingIndex = 1
): {
  whereSql: string
  values: unknown[]
  nextIndex: number
} => {
  const whereClauses: string[] = []
  const values: unknown[] = []
  let index = startingIndex

  if (options.publishedOnly) {
    whereClauses.push(PUBLIC_BLOG_POSTS_WHERE)
  }

  if (options.draftOnly) {
    whereClauses.push('draft = true')
  }

  if (options.featuredOnly) {
    whereClauses.push('featured = true')
  }

  if (options.staffPickOnly) {
    whereClauses.push('staff_pick = true')
  }

  if (options.tag) {
    whereClauses.push(`$${index} = any(tags)`)
    values.push(options.tag)
    index += 1
  }

  if (options.author) {
    whereClauses.push(`author = $${index}`)
    values.push(options.author)
    index += 1
  }

  if (options.search) {
    whereClauses.push(`(
      title ilike $${index}
      or summary ilike $${index}
      or content ilike $${index}
      or author ilike $${index}
    )`)
    values.push(`%${options.search}%`)
    index += 1
  }

  if (options.createdAfter) {
    whereClauses.push(`created_at >= $${index}`)
    values.push(options.createdAfter)
    index += 1
  }

  if (options.createdBefore) {
    whereClauses.push(`created_at <= $${index}`)
    values.push(options.createdBefore)
    index += 1
  }

  if (options.publishedAfter) {
    whereClauses.push(`publish_timestamp >= $${index}`)
    values.push(options.publishedAfter)
    index += 1
  }

  if (options.publishedBefore) {
    whereClauses.push(`publish_timestamp <= $${index}`)
    values.push(options.publishedBefore)
    index += 1
  }

  return {
    whereSql: whereClauses.length ? `where ${whereClauses.join(' and ')}` : '',
    values,
    nextIndex: index
  }
}

export const blogPostExistsById = async (id: string): Promise<boolean> => {
  const result = await postgresPool.query(
    `select 1
     from ${TABLE_NAME}
     where id = $1
     limit 1`,
    [id]
  )

  return result.rows.length > 0
}

export const getBlogPostById = async (
  id: string
): Promise<BlogPostRecord | null> => {
  const result = await postgresPool.query(
    `select *
     from ${TABLE_NAME}
     where id = $1
     limit 1`,
    [id]
  )

  if (!result.rows.length) return null
  return mapRow(result.rows[0])
}

export const getBlogPostBySlug = async (
  slug: string
): Promise<BlogPostRecord | null> => {
  const result = await postgresPool.query(
    `select *
     from ${TABLE_NAME}
     where slug = $1
     limit 1`,
    [slug]
  )

  if (!result.rows.length) return null
  return mapRow(result.rows[0])
}

export const getPublishedBlogPostBySlug = async (
  slug: string
): Promise<BlogPostRecord | null> => {
  const result = await postgresPool.query(
    `select *
     from ${TABLE_NAME}
     where slug = $1
       and ${PUBLIC_BLOG_POSTS_WHERE}
     limit 1`,
    [slug]
  )

  if (!result.rows.length) return null
  return mapRow(result.rows[0])
}

export const getLatestBlogPost = async (): Promise<BlogPostRecord | null> => {
  const result = await postgresPool.query(
    `select *
     from ${TABLE_NAME}
     where ${PUBLIC_BLOG_POSTS_WHERE}
     order by publish_timestamp desc nulls last, created_at desc
     limit 1`
  )

  if (!result.rows.length) return null

  return mapRow(result.rows[0])
}

export const slugExists = async (
  slug: string,
  excludeId?: string
): Promise<boolean> => {
  const result = excludeId
    ? await postgresPool.query(
        `select 1
         from ${TABLE_NAME}
         where slug = $1
           and id <> $2
         limit 1`,
        [slug, excludeId]
      )
    : await postgresPool.query(
        `select 1
         from ${TABLE_NAME}
         where slug = $1
         limit 1`,
        [slug]
      )

  return result.rows.length > 0
}

export const listBlogPosts = async (
  options: ListBlogPostsOptions = {}
): Promise<BlogPostRecord[]> => {
  const { whereSql, values } = buildWhereClause(options)
  const orderBySql = buildOrderByClause(options.orderField, options.orderDirection)

  const result = await postgresPool.query(
    `select *
     from ${TABLE_NAME}
     ${whereSql}
     ${orderBySql}`,
    values
  )

  return result.rows.map(mapRow)
}

export const listPublishedBlogPosts = async (): Promise<BlogPostRecord[]> => {
  return listBlogPosts({ publishedOnly: true })
}

export const listFeaturedBlogPosts = async (): Promise<BlogPostRecord[]> => {
  return listBlogPosts({
    publishedOnly: true,
    featuredOnly: true
  })
}

export const listStaffPickBlogPosts = async (): Promise<BlogPostRecord[]> => {
  return listBlogPosts({
    publishedOnly: true,
    staffPickOnly: true
  })
}

export const listBlogPostsByTag = async (
  tag: string,
  options: Omit<ListBlogPostsOptions, 'tag'> = {}
): Promise<BlogPostRecord[]> => {
  return listBlogPosts({
    ...options,
    tag
  })
}

export const listBlogPostsByAuthor = async (
  author: string,
  options: Omit<ListBlogPostsOptions, 'author'> = {}
): Promise<BlogPostRecord[]> => {
  return listBlogPosts({
    ...options,
    author
  })
}

export const countBlogPosts = async (
  options: ListBlogPostsOptions = {}
): Promise<number> => {
  const { whereSql, values } = buildWhereClause(options)

  const result = await postgresPool.query<{ total: string }>(
    `select count(*)::text as total
     from ${TABLE_NAME}
     ${whereSql}`,
    values
  )

  return Number(result.rows[0]?.total ?? 0)
}

export const listBlogPostsPaginated = async (
  options: ListBlogPostsOptions = {}
): Promise<PaginatedResult<BlogPostRecord>> => {
  const page = Math.max(1, Number(options.page ?? 1))
  const pageSize = Math.max(1, Math.min(100, Number(options.pageSize ?? 10)))
  const offset = (page - 1) * pageSize

  const { whereSql, values, nextIndex } = buildWhereClause(options)
  const orderBySql = buildOrderByClause(options.orderField, options.orderDirection)

  const countResult = await postgresPool.query<{ total: string }>(
    `select count(*)::text as total
     from ${TABLE_NAME}
     ${whereSql}`,
    values
  )

  const totalItems = Number(countResult.rows[0]?.total ?? 0)
  const totalPages = totalItems > 0 ? Math.ceil(totalItems / pageSize) : 0

  const paginatedValues = [...values, pageSize, offset]

  const result = await postgresPool.query(
    `select *
     from ${TABLE_NAME}
     ${whereSql}
     ${orderBySql}
     limit $${nextIndex}
     offset $${nextIndex + 1}`,
    paginatedValues
  )

  return {
    data: result.rows.map(mapRow),
    pagination: {
      currentPage: page,
      pageSize,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      totalPages,
      totalItems
    }
  }
}

export const listPublishedBlogPostSlugs = async (): Promise<string[]> => {
  const result = await postgresPool.query<{ slug: string }>(
    `select slug
     from ${TABLE_NAME}
     where ${PUBLIC_BLOG_POSTS_WHERE}
       and slug <> ''
     order by publish_timestamp desc nulls last, created_at desc`
  )

  return result.rows.map(row => row.slug)
}

export const createBlogPost = async (
  input: CreateBlogPostInput
): Promise<BlogPostRecord> => {
  const result = await postgresPool.query(
    `insert into ${TABLE_NAME} (
      id,
      slug,
      title,
      summary,
      content,
      author,
      tags,
      thumbnail,
      thumbnail_alt,
      thumbnail_width,
      thumbnail_height,
      staff_pick,
      featured,
      read_time,
      draft,
      published,
      publish_timestamp,
      seo_title,
      seo_description,
      seo_image,
      canonical_url
    )
    values (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21
    )
    returning *`,
    [
      input.id,
      input.slug,
      input.title,
      input.summary,
      input.content,
      input.author ?? '',
      input.tags ?? [],
      input.thumbnail ?? '',
      input.thumbnailAlt ?? '',
      input.thumbnailWidth ?? null,
      input.thumbnailHeight ?? null,
      input.staffPick ?? false,
      input.featured ?? false,
      input.readTime,
      input.draft ?? true,
      input.published ?? false,
      input.publishTimestamp ?? null,
      input.seoTitle ?? '',
      input.seoDescription ?? '',
      input.seoImage ?? '',
      input.canonicalUrl ?? ''
    ]
  )

  return mapRow(result.rows[0])
}

export const updateBlogPost = async (
  id: string,
  input: UpdateBlogPostInput
): Promise<BlogPostRecord | null> => {
  const result = await postgresPool.query(
    `update ${TABLE_NAME}
     set
       slug = coalesce($2, slug),
       title = coalesce($3, title),
       summary = coalesce($4, summary),
       content = coalesce($5, content),
       author = coalesce($6, author),
       tags = coalesce($7, tags),
       thumbnail = coalesce($8, thumbnail),
       thumbnail_alt = coalesce($9, thumbnail_alt),
       thumbnail_width = coalesce($10, thumbnail_width),
       thumbnail_height = coalesce($11, thumbnail_height),
       staff_pick = coalesce($12, staff_pick),
       featured = coalesce($13, featured),
       read_time = coalesce($14, read_time),
       draft = coalesce($15, draft),
       published = coalesce($16, published),
       publish_timestamp = coalesce($17, publish_timestamp),
       seo_title = coalesce($18, seo_title),
       seo_description = coalesce($19, seo_description),
       seo_image = coalesce($20, seo_image),
       canonical_url = coalesce($21, canonical_url),
       updated_at = now()
     where id = $1
     returning *`,
    [
      id,
      input.slug ?? null,
      input.title ?? null,
      input.summary ?? null,
      input.content ?? null,
      input.author ?? null,
      input.tags ?? null,
      input.thumbnail ?? null,
      input.thumbnailAlt ?? null,
      input.thumbnailWidth ?? null,
      input.thumbnailHeight ?? null,
      input.staffPick ?? null,
      input.featured ?? null,
      input.readTime ?? null,
      input.draft ?? null,
      input.published ?? null,
      input.publishTimestamp ?? null,
      input.seoTitle ?? null,
      input.seoDescription ?? null,
      input.seoImage ?? null,
      input.canonicalUrl ?? null
    ]
  )

  if (!result.rows.length) return null
  return mapRow(result.rows[0])
}

export const publishBlogPost = async (
  id: string,
  publishTimestamp?: Date
): Promise<BlogPostRecord | null> => {
  const result = await postgresPool.query(
    `update ${TABLE_NAME}
     set
       published = true,
       draft = false,
       publish_timestamp = coalesce($2, now()),
       updated_at = now()
     where id = $1
     returning *`,
    [id, publishTimestamp ?? null]
  )

  if (!result.rows.length) return null
  return mapRow(result.rows[0])
}

export const unpublishBlogPost = async (
  id: string
): Promise<BlogPostRecord | null> => {
  const result = await postgresPool.query(
    `update ${TABLE_NAME}
     set
       published = false,
       publish_timestamp = null,
       updated_at = now()
     where id = $1
     returning *`,
    [id]
  )

  if (!result.rows.length) return null
  return mapRow(result.rows[0])
}

export const setBlogPostDraftStatus = async (
  id: string,
  draft: boolean
): Promise<BlogPostRecord | null> => {
  const result = await postgresPool.query(
    `update ${TABLE_NAME}
     set
       draft = $2,
       updated_at = now()
     where id = $1
     returning *`,
    [id, draft]
  )

  if (!result.rows.length) return null
  return mapRow(result.rows[0])
}

export const toggleBlogPostDraft = async (
  id: string
): Promise<BlogPostRecord | null> => {
  const result = await postgresPool.query(
    `update ${TABLE_NAME}
     set
       draft = not draft,
       updated_at = now()
     where id = $1
     returning *`,
    [id]
  )

  if (!result.rows.length) return null
  return mapRow(result.rows[0])
}

export const setBlogPostFeaturedStatus = async (
  id: string,
  featured: boolean
): Promise<BlogPostRecord | null> => {
  const result = await postgresPool.query(
    `update ${TABLE_NAME}
     set
       featured = $2,
       updated_at = now()
     where id = $1
     returning *`,
    [id, featured]
  )

  if (!result.rows.length) return null
  return mapRow(result.rows[0])
}

export const toggleBlogPostFeatured = async (
  id: string
): Promise<BlogPostRecord | null> => {
  const result = await postgresPool.query(
    `update ${TABLE_NAME}
     set
       featured = not featured,
       updated_at = now()
     where id = $1
     returning *`,
    [id]
  )

  if (!result.rows.length) return null
  return mapRow(result.rows[0])
}

export const setBlogPostStaffPickStatus = async (
  id: string,
  staffPick: boolean
): Promise<BlogPostRecord | null> => {
  const result = await postgresPool.query(
    `update ${TABLE_NAME}
     set
       staff_pick = $2,
       updated_at = now()
     where id = $1
     returning *`,
    [id, staffPick]
  )

  if (!result.rows.length) return null
  return mapRow(result.rows[0])
}

export const toggleBlogPostStaffPick = async (
  id: string
): Promise<BlogPostRecord | null> => {
  const result = await postgresPool.query(
    `update ${TABLE_NAME}
     set
       staff_pick = not staff_pick,
       updated_at = now()
     where id = $1
     returning *`,
    [id]
  )

  if (!result.rows.length) return null
  return mapRow(result.rows[0])
}

export const deleteBlogPost = async (id: string): Promise<boolean> => {
  const result = await postgresPool.query(
    `delete
     from ${TABLE_NAME}
     where id = $1`,
    [id]
  )

  return result.rowCount === 1
}
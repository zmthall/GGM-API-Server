import { postgresPool } from '../../../config/postgres'
import { toSafeBoolean, toSafeDate, toSafeNullableDate, toSafeObject, toSafeString, toSafeStringArray } from '../../safe'

const TABLE_NAME = 'blog_posts'

const PUBLIC_BLOG_POSTS_WHERE =
  `draft = false
  and published is not null
  and published <= current_date`

const BLOG_POSTS_ORDER_BY = `order by published desc nulls last, date desc nulls last, created_at desc`

export interface BlogPostRecord {
  id: string
  slug: string
  title: string
  description: string
  summary: string
  author: string
  draft: boolean
  staff_pick: boolean
  date: Date | null
  published: string | null
  read_time: number
  thumbnail: string
  thumbnail_alt: string
  thumbnail_width: number | null
  thumbnail_height: number | null
  body_markdown: string
  source_file: string
  source_file_path: string
  source_content_id: string
  source_path: string
  tags: string[]
  created_at: Date
  updated_at: Date
  raw_frontmatter: Record<string, unknown>
  raw_document: Record<string, unknown>
}

export interface CreateBlogPostInput {
  id: string
  slug: string
  title: string
  description?: string
  summary: string
  author?: string
  draft?: boolean
  staffPick?: boolean
  date?: Date | null
  published?: string | null
  readTime?: number
  thumbnail?: string
  thumbnailAlt?: string
  thumbnailWidth?: number | null
  thumbnailHeight?: number | null
  bodyMarkdown: string
  sourceFile?: string
  sourceFilePath?: string
  sourceContentId?: string
  sourcePath?: string
  tags?: string[]
  rawFrontmatter?: Record<string, unknown>
  rawDocument?: Record<string, unknown>
}

export interface UpdateBlogPostInput {
  slug?: string
  title?: string
  description?: string
  summary?: string
  author?: string
  draft?: boolean
  staffPick?: boolean
  date?: Date | null
  published?: string | null
  readTime?: number
  thumbnail?: string
  thumbnailAlt?: string
  thumbnailWidth?: number | null
  thumbnailHeight?: number | null
  bodyMarkdown?: string
  sourceFile?: string
  sourceFilePath?: string
  sourceContentId?: string
  sourcePath?: string
  tags?: string[]
  rawFrontmatter?: Record<string, unknown>
  rawDocument?: Record<string, unknown>
}

export interface ListBlogPostsOptions {
  publishedOnly?: boolean
  staffPickOnly?: boolean
}

const mapRow = (row: Record<string, unknown>): BlogPostRecord => {
  return {
    id: toSafeString(row.id),
    slug: toSafeString(row.slug ?? ''),
    title: toSafeString(row.title ?? ''),
    description: toSafeString(row.description ?? ''),
    summary: toSafeString(row.summary ?? ''),
    author: toSafeString(row.author ?? ''),
    draft: toSafeBoolean(row.draft),
    staff_pick: toSafeBoolean(row.staff_pick),
    date: toSafeNullableDate(row.date as Date),
    published: row.published ? toSafeString(row.published) : null,
    read_time: Number(row.read_time ?? 0),
    thumbnail: toSafeString(row.thumbnail ?? ''),
    thumbnail_alt: toSafeString(row.thumbnail_alt ?? ''),
    thumbnail_width: row.thumbnail_width == null ? null : Number(row.thumbnail_width),
    thumbnail_height: row.thumbnail_height == null ? null : Number(row.thumbnail_height),
    body_markdown: toSafeString(row.body_markdown ?? ''),
    source_file: toSafeString(row.source_file ?? ''),
    source_file_path: toSafeString(row.source_file_path ?? ''),
    source_content_id: toSafeString(row.source_content_id ?? ''),
    source_path: toSafeString(row.source_path ?? ''),
    tags: toSafeStringArray(row.tags),
    created_at: toSafeDate(row.created_at),
    updated_at: toSafeDate(row.updated_at),
    raw_frontmatter: toSafeObject(row.raw_frontmatter),
    raw_document: toSafeObject(row.raw_document)
  }
}

export const getBlogPostById = async (id: string): Promise<BlogPostRecord | null> => {
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

export const getBlogPostBySlug = async (slug: string): Promise<BlogPostRecord | null> => {
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

export const getPublishedBlogPostBySlug = async (slug: string): Promise<BlogPostRecord | null> => {
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

export const slugExists = async (slug: string, excludeId?: string): Promise<boolean> => {
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

export const listBlogPosts = async (): Promise<BlogPostRecord[]> => {
  const result = await postgresPool.query(
    `select *
    from ${TABLE_NAME}
    ${BLOG_POSTS_ORDER_BY}`
  )

  return result.rows.map(mapRow)
}

export const listBlogPostsWithOptions = async (
  options: ListBlogPostsOptions = {}
): Promise<BlogPostRecord[]> => {
  const whereClauses: string[] = []

  if (options.publishedOnly) {
    whereClauses.push(PUBLIC_BLOG_POSTS_WHERE)
  }

  if (options.staffPickOnly) {
    whereClauses.push('staff_pick = true')
  }

  const whereSql = whereClauses.length ? `where ${whereClauses.join(' and ')}` : ''

  const result = await postgresPool.query(
    `select *
    from ${TABLE_NAME}
    ${whereSql}
    ${BLOG_POSTS_ORDER_BY}`
  )

  return result.rows.map(mapRow)
}

export const listPublishedBlogPosts = async (): Promise<BlogPostRecord[]> => {
  const result = await postgresPool.query(
    `select *
    from ${TABLE_NAME}
    where ${PUBLIC_BLOG_POSTS_WHERE}
    ${BLOG_POSTS_ORDER_BY}`
  )

  return result.rows.map(mapRow)
}

export const listPublishedBlogPostSlugs = async (): Promise<string[]> => {
  const result = await postgresPool.query<{ slug: string }>(
    `select slug
    from ${TABLE_NAME}
    where ${PUBLIC_BLOG_POSTS_WHERE}
      and slug is not null
      and slug <> ''
    ${BLOG_POSTS_ORDER_BY}`
  )

  return result.rows.map(row => row.slug)
}

export const listStaffPickBlogPosts = async (): Promise<BlogPostRecord[]> => {
  const result = await postgresPool.query(
    `select *
    from ${TABLE_NAME}
    where staff_pick = true
      and ${PUBLIC_BLOG_POSTS_WHERE}
    ${BLOG_POSTS_ORDER_BY}`
  )

  return result.rows.map(mapRow)
}

export const createBlogPost = async (
  input: CreateBlogPostInput
): Promise<BlogPostRecord> => {
  const result = await postgresPool.query(
    `insert into ${TABLE_NAME} (
      id,
      slug,
      title,
      description,
      summary,
      author,
      draft,
      staff_pick,
      date,
      published,
      read_time,
      thumbnail,
      thumbnail_alt,
      thumbnail_width,
      thumbnail_height,
      body_markdown,
      source_file,
      source_file_path,
      source_content_id,
      source_path,
      tags,
      raw_frontmatter,
      raw_document
    )
    values (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23
    )
    returning *`,
    [
      input.id,
      input.slug,
      input.title,
      input.description ?? '',
      input.summary,
      input.author ?? '',
      input.draft ?? false,
      input.staffPick ?? false,
      input.date ?? null,
      input.published ?? null,
      input.readTime ?? 0,
      input.thumbnail ?? '',
      input.thumbnailAlt ?? '',
      input.thumbnailWidth ?? null,
      input.thumbnailHeight ?? null,
      input.bodyMarkdown,
      input.sourceFile ?? '',
      input.sourceFilePath ?? '',
      input.sourceContentId ?? '',
      input.sourcePath ?? '',
      input.tags ?? [],
      JSON.stringify(input.rawFrontmatter ?? {}),
      JSON.stringify(input.rawDocument ?? {})
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
      description = coalesce($4, description),
      summary = coalesce($5, summary),
      author = coalesce($6, author),
      draft = coalesce($7, draft),
      staff_pick = coalesce($8, staff_pick),
      date = coalesce($9, date),
      published = coalesce($10, published),
      read_time = coalesce($11, read_time),
      thumbnail = coalesce($12, thumbnail),
      thumbnail_alt = coalesce($13, thumbnail_alt),
      thumbnail_width = coalesce($14, thumbnail_width),
      thumbnail_height = coalesce($15, thumbnail_height),
      body_markdown = coalesce($16, body_markdown),
      source_file = coalesce($17, source_file),
      source_file_path = coalesce($18, source_file_path),
      source_content_id = coalesce($19, source_content_id),
      source_path = coalesce($20, source_path),
      tags = coalesce($21, tags),
      raw_frontmatter = coalesce($22::jsonb, raw_frontmatter),
      raw_document = coalesce($23::jsonb, raw_document)
    where id = $1
    returning *`,
    [
      id,
      input.slug ?? null,
      input.title ?? null,
      input.description ?? null,
      input.summary ?? null,
      input.author ?? null,
      input.draft ?? null,
      input.staffPick ?? null,
      input.date ?? null,
      input.published ?? null,
      input.readTime ?? null,
      input.thumbnail ?? null,
      input.thumbnailAlt ?? null,
      input.thumbnailWidth ?? null,
      input.thumbnailHeight ?? null,
      input.bodyMarkdown ?? null,
      input.sourceFile ?? null,
      input.sourceFilePath ?? null,
      input.sourceContentId ?? null,
      input.sourcePath ?? null,
      input.tags ?? null,
      input.rawFrontmatter ? JSON.stringify(input.rawFrontmatter) : null,
      input.rawDocument ? JSON.stringify(input.rawDocument) : null
    ]
  )

  if (!result.rows.length) return null

  return mapRow(result.rows[0])
}

export const deleteBlogPost = async (id: string): Promise<boolean> => {
  const result = await postgresPool.query(
    `delete from ${TABLE_NAME}
    where id = $1`,
    [id]
  )

  return result.rowCount === 1
}
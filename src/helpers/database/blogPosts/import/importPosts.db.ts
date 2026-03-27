import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import matter from 'gray-matter'
import { createBlogPost, getBlogPostBySlug } from '../blogPosts.db'
import { postgresPool } from '../../../../config/postgres'


type Frontmatter = {
  id?: string
  title?: string
  description?: string
  summary?: string
  date?: string
  author?: string
  draft?: boolean | string
  published?: boolean | string
  tags?: string[]
  thumbnail?: string
  thumbnailAlt?: string
  thumbnailHeight?: string | number
  thumbnailWidth?: string | number
  readTime?: string | number
  staffPick?: boolean | string
  featured?: boolean | string
  seoTitle?: string
  seoDescription?: string
  seoImage?: string
  canonicalUrl?: string
}

const BLOG_MARKDOWN_DIR = __dirname
const CANONICAL_BASE_URL = 'https://www.goldengatemanor.com/news/blog/post'

const log = (message: string): void => {
  console.log(`[blog-import] ${message}`)
}

const stripBom = (value: string): string => value.replace(/^\uFEFF/, '')

const normalizeContent = (rawContent: string): string => {
  return stripBom(rawContent).trim()
}

const getSlugFromFilename = (filename: string): string => {
  return filename.replace(/\.md$/i, '').trim()
}

const buildCanonicalUrl = (slug: string): string => {
  return `${CANONICAL_BASE_URL}/${slug}`
}

const parseBoolean = (value: unknown, fallback = false): boolean => {
  if (typeof value === 'boolean') return value

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (normalized === 'true') return true
    if (normalized === 'false') return false
  }

  return fallback
}

const parseNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value

  if (typeof value === 'string') {
    const parsed = Number(value.trim())
    if (Number.isFinite(parsed)) return parsed
  }

  return fallback
}

const parseStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return []

  return value
    .map(item => String(item).trim())
    .filter(Boolean)
}

const normalizeDateString = (value: unknown): string | null => {
  if (typeof value !== 'string' || !value.trim()) return null

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  return date.toISOString()
}

const normalizeSummary = (frontmatter: Frontmatter): string => {
  if (typeof frontmatter.summary === 'string' && frontmatter.summary.trim()) {
    return frontmatter.summary.trim()
  }

  if (typeof frontmatter.description === 'string' && frontmatter.description.trim()) {
    return frontmatter.description.trim()
  }

  return ''
}

const normalizeThumbnailPath = (value: unknown): string => {
  if (typeof value !== 'string' || !value.trim()) return ''

  const raw = value.trim()

  if (raw.startsWith('/uploads/blog/thumbnails/')) return raw

  if (raw.startsWith('/')) {
    const filename = raw.split('/').pop() ?? ''
    return filename ? `/uploads/blog/thumbnails/${filename}` : ''
  }

  try {
    const url = new URL(raw)
    const filename = url.pathname.split('/').pop() ?? ''
    return filename ? `/uploads/blog/thumbnails/${filename}` : ''
  } catch {
    const filename = raw.replace(/^\/+/, '').split('/').pop() ?? ''
    return filename ? `/uploads/blog/thumbnails/${filename}` : ''
  }
}

const normalizePublishState = (
  frontmatter: Frontmatter
): { draft: boolean; published: boolean; publishTimestamp: string | null } => {
  const draft = parseBoolean(frontmatter.draft, false)

  if (draft) {
    return {
      draft: true,
      published: false,
      publishTimestamp: null
    }
  }

  const publishedValue = frontmatter.published

  if (typeof publishedValue === 'boolean') {
    const fallbackTimestamp = normalizeDateString(frontmatter.date)

    return {
      draft: false,
      published: publishedValue,
      publishTimestamp: publishedValue ? fallbackTimestamp : null
    }
  }

  const publishedTimestamp = normalizeDateString(publishedValue)
  const dateTimestamp = normalizeDateString(frontmatter.date)

  return {
    draft: false,
    published: true,
    publishTimestamp: publishedTimestamp ?? dateTimestamp
  }
}

const validateRequiredFields = (slug: string, frontmatter: Frontmatter, content: string): void => {
  if (!slug) {
    throw new Error('Missing slug derived from filename.')
  }

  if (!frontmatter.title || !frontmatter.title.trim()) {
    throw new Error(`Missing title for slug "${slug}".`)
  }

  if (!content.trim()) {
    throw new Error(`Missing markdown body content for slug "${slug}".`)
  }
}

const importMarkdownFile = async (absoluteFilePath: string): Promise<void> => {
  const filename = path.basename(absoluteFilePath)
  const slug = getSlugFromFilename(filename)

  log(`Reading ${filename}`)

  const rawFile = fs.readFileSync(absoluteFilePath, 'utf-8')
  const parsed = matter(rawFile)
  const frontmatter = parsed.data as Frontmatter
  const content = normalizeContent(parsed.content)

  validateRequiredFields(slug, frontmatter, content)

  const existing = await getBlogPostBySlug(slug)
  if (existing) {
    log(`Skipping "${slug}" because it already exists in the database.`)
    return
  }

  const summary = normalizeSummary(frontmatter)
  const tags = parseStringArray(frontmatter.tags)

  const thumbnail = normalizeThumbnailPath(frontmatter.thumbnail)
  const thumbnailAlt =
    typeof frontmatter.thumbnailAlt === 'string' && frontmatter.thumbnailAlt.trim()
      ? frontmatter.thumbnailAlt.trim()
      : frontmatter.title!.trim()

  const thumbnailWidth = parseNumber(frontmatter.thumbnailWidth, 0)
  const thumbnailHeight = parseNumber(frontmatter.thumbnailHeight, 0)
  const readTime = parseNumber(frontmatter.readTime, 0)

  const staffPick = parseBoolean(frontmatter.staffPick, false)
  const featured = parseBoolean(frontmatter.featured, false)

  const publishState = normalizePublishState(frontmatter)

  const seoTitle =
    typeof frontmatter.seoTitle === 'string' && frontmatter.seoTitle.trim()
      ? frontmatter.seoTitle.trim()
      : frontmatter.title!.trim()

  const seoDescription =
    typeof frontmatter.seoDescription === 'string' && frontmatter.seoDescription.trim()
      ? frontmatter.seoDescription.trim()
      : summary

  const seoImage =
    typeof frontmatter.seoImage === 'string' && frontmatter.seoImage.trim()
      ? normalizeThumbnailPath(frontmatter.seoImage)
      : thumbnail

  const canonicalUrl =
    typeof frontmatter.canonicalUrl === 'string' && frontmatter.canonicalUrl.trim()
      ? frontmatter.canonicalUrl.trim()
      : buildCanonicalUrl(slug)

  const payload = {
    id: typeof frontmatter.id === 'string' && frontmatter.id.trim() ? frontmatter.id.trim() : randomUUID(),
    slug,
    title: frontmatter.title!.trim(),
    summary,
    content,
    author:
      typeof frontmatter.author === 'string' && frontmatter.author.trim()
        ? frontmatter.author.trim()
        : 'Golden Gate Manor Inc.',
    tags,
    thumbnail,
    thumbnailAlt,
    thumbnailWidth,
    thumbnailHeight,
    staffPick,
    featured,
    readTime,
    draft: publishState.draft,
    published: publishState.published,
    publishTimestamp: publishState.publishTimestamp,
    seoTitle,
    seoDescription,
    seoImage,
    canonicalUrl
  }

  const created = await createBlogPost(payload as any)
  log(`Imported "${created.slug}"`)
}

const run = async (): Promise<void> => {
  try {
    if (!fs.existsSync(BLOG_MARKDOWN_DIR)) {
      throw new Error(`Markdown directory not found: ${BLOG_MARKDOWN_DIR}`)
    }

    const allFiles = fs
    .readdirSync(BLOG_MARKDOWN_DIR)
    .filter(file => file.toLowerCase().endsWith('.md'))
    .sort((a, b) => a.localeCompare(b))

    if (allFiles.length === 0) {
      log('No markdown files found. Nothing to import.')
      return
    }

    log(`Found ${allFiles.length} markdown files.`)

    for (const file of allFiles) {
      const absoluteFilePath = path.join(BLOG_MARKDOWN_DIR, file)

      try {
        await importMarkdownFile(absoluteFilePath)
      } catch (error) {
        console.error(`[blog-import] Failed importing "${file}"`)
        console.error(error)
      }
    }

    log('Import completed.')
  } catch (error) {
    console.error('[blog-import] Fatal import error')
    console.error(error)
    process.exitCode = 1
  } finally {
    await postgresPool.end()
  }
}

void run()
import { Request } from "express"
import { CreateBlogPostInput, ListBlogPostsOptions, UpdateBlogPostInput } from "../types/blogPosts"

export const toOptionalString = (value: unknown): string | undefined => {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

export const toOptionalNumber = (value: unknown): number | undefined => {
  if (value === null || value === undefined || value === '') return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

export const toOptionalBoolean = (value: unknown): boolean | undefined => {
  if (typeof value === 'boolean') return value
  if (typeof value !== 'string') return undefined

  const normalized = value.trim().toLowerCase()

  if (normalized === 'true') return true
  if (normalized === 'false') return false

  return undefined
}

export const toOptionalDate = (value: unknown): Date | undefined => {
  if (!value) return undefined

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.getTime())) return parsed
  }

  return undefined
}

export const toStringArray = (value: unknown): string[] | undefined => {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === 'string')
      .map(item => item.trim())
      .filter(Boolean)
  }

  if (typeof value === 'string' && value.trim()) {
    return value
      .split(',')
      .map(item => item.trim())
      .filter(Boolean)
  }

  return undefined
}

export const parseListOptions = (req: Request): ListBlogPostsOptions => {
  return {
    page: toOptionalNumber(req.query.page),
    pageSize: toOptionalNumber(req.query.pageSize),
    orderField: toOptionalString(req.query.orderField) as ListBlogPostsOptions['orderField'],
    orderDirection: toOptionalString(req.query.orderDirection) as ListBlogPostsOptions['orderDirection'],
    publishedOnly: toOptionalBoolean(req.query.publishedOnly),
    draftOnly: toOptionalBoolean(req.query.draftOnly),
    featuredOnly: toOptionalBoolean(req.query.featuredOnly),
    staffPickOnly: toOptionalBoolean(req.query.staffPickOnly),
    tag: toOptionalString(req.query.tag),
    author: toOptionalString(req.query.author),
    search: toOptionalString(req.query.search),
    createdAfter: toOptionalDate(req.query.createdAfter),
    createdBefore: toOptionalDate(req.query.createdBefore),
    publishedAfter: toOptionalDate(req.query.publishedAfter),
    publishedBefore: toOptionalDate(req.query.publishedBefore)
  }
}

export const parseCreateBody = (req: Request): CreateBlogPostInput => {
  return {
    id: String(req.body.id),
    slug: String(req.body.slug),
    title: String(req.body.title),
    summary: String(req.body.summary),
    content: String(req.body.content),
    author: toOptionalString(req.body.author),
    tags: toStringArray(req.body.tags),
    thumbnail: toOptionalString(req.body.thumbnail),
    thumbnailAlt: toOptionalString(req.body.thumbnailAlt),
    thumbnailWidth: toOptionalNumber(req.body.thumbnailWidth),
    thumbnailHeight: toOptionalNumber(req.body.thumbnailHeight),
    staffPick: toOptionalBoolean(req.body.staffPick),
    featured: toOptionalBoolean(req.body.featured),
    readTime: Number(req.body.readTime ?? 0),
    draft: toOptionalBoolean(req.body.draft),
    published: toOptionalBoolean(req.body.published),
    publishTimestamp: toOptionalDate(req.body.publishTimestamp) ?? null,
    seoTitle: toOptionalString(req.body.seoTitle),
    seoDescription: toOptionalString(req.body.seoDescription),
    seoImage: toOptionalString(req.body.seoImage),
    canonicalUrl: toOptionalString(req.body.canonicalUrl)
  }
}

export const parseUpdateBody = (req: Request): UpdateBlogPostInput => {
  return {
    slug: toOptionalString(req.body.slug),
    title: toOptionalString(req.body.title),
    summary: toOptionalString(req.body.summary),
    content: toOptionalString(req.body.content),
    author: toOptionalString(req.body.author),
    tags: toStringArray(req.body.tags),
    thumbnail: toOptionalString(req.body.thumbnail),
    thumbnailAlt: toOptionalString(req.body.thumbnailAlt),
    thumbnailWidth: toOptionalNumber(req.body.thumbnailWidth),
    thumbnailHeight: toOptionalNumber(req.body.thumbnailHeight),
    staffPick: toOptionalBoolean(req.body.staffPick),
    featured: toOptionalBoolean(req.body.featured),
    readTime: toOptionalNumber(req.body.readTime),
    draft: toOptionalBoolean(req.body.draft),
    published: toOptionalBoolean(req.body.published),
    publishTimestamp: toOptionalDate(req.body.publishTimestamp),
    seoTitle: toOptionalString(req.body.seoTitle),
    seoDescription: toOptionalString(req.body.seoDescription),
    seoImage: toOptionalString(req.body.seoImage),
    canonicalUrl: toOptionalString(req.body.canonicalUrl)
  }
}
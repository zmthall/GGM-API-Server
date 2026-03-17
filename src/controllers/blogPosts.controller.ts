import type { Request, Response } from 'express'
import type {
  CreateBlogPostInput,
  ListBlogPostsOptions,
  UpdateBlogPostInput
} from '../types/blogPosts'
import { blogPostsService } from '../services/blogPosts.services'

const toOptionalString = (value: unknown): string | undefined => {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

const toOptionalNumber = (value: unknown): number | undefined => {
  if (value === null || value === undefined || value === '') return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

const toOptionalBoolean = (value: unknown): boolean | undefined => {
  if (typeof value === 'boolean') return value
  if (typeof value !== 'string') return undefined

  const normalized = value.trim().toLowerCase()

  if (normalized === 'true') return true
  if (normalized === 'false') return false

  return undefined
}

const toOptionalDate = (value: unknown): Date | undefined => {
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

const toStringArray = (value: unknown): string[] | undefined => {
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

const parseListOptions = (req: Request): ListBlogPostsOptions => {
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

const parseCreateBody = (req: Request): CreateBlogPostInput => {
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

const parseUpdateBody = (req: Request): UpdateBlogPostInput => {
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

export const blogPostsController = {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const input = parseCreateBody(req)

      if (!input.id || !input.slug || !input.title || !input.summary || !input.content) {
        res.status(400).json({
          success: false,
          message: 'id, slug, title, summary, and content are required.'
        })
        return
      }

      const created = await blogPostsService.create(input)

      res.status(201).json({
        success: true,
        data: created
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to create blog post.',
        error
      })
    }
  },

  async update(req: Request, res: Response): Promise<void> {
    try {
      const updated = await blogPostsService.update(req.params.id, parseUpdateBody(req))

      if (!updated) {
        res.status(404).json({
          success: false,
          message: 'Blog post not found.'
        })
        return
      }

      res.status(200).json({
        success: true,
        data: updated
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update blog post.',
        error
      })
    }
  },

  async remove(req: Request, res: Response): Promise<void> {
    try {
      const deleted = await blogPostsService.remove(req.params.id)

      if (!deleted) {
        res.status(404).json({
          success: false,
          message: 'Blog post not found.'
        })
        return
      }

      res.status(200).json({
        success: true,
        deleted: true
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete blog post.',
        error
      })
    }
  },

  async publish(req: Request, res: Response): Promise<void> {
    try {
      const publishTimestamp = toOptionalDate(req.body.publishTimestamp)
      const published = await blogPostsService.publish(req.params.id, publishTimestamp)

      if (!published) {
        res.status(404).json({
          success: false,
          message: 'Blog post not found.'
        })
        return
      }

      res.status(200).json({
        success: true,
        data: published
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to publish blog post.',
        error
      })
    }
  },

  async unpublish(req: Request, res: Response): Promise<void> {
    try {
      const unpublished = await blogPostsService.unpublish(req.params.id)

      if (!unpublished) {
        res.status(404).json({
          success: false,
          message: 'Blog post not found.'
        })
        return
      }

      res.status(200).json({
        success: true,
        data: unpublished
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to unpublish blog post.',
        error
      })
    }
  },

  async setDraft(req: Request, res: Response): Promise<void> {
    try {
      const draft = toOptionalBoolean(req.body.draft)

      if (draft === undefined) {
        res.status(400).json({
          success: false,
          message: 'draft boolean is required.'
        })
        return
      }

      const result = await blogPostsService.setDraftStatus(req.params.id, draft)

      if (!result) {
        res.status(404).json({
          success: false,
          message: 'Blog post not found.'
        })
        return
      }

      res.status(200).json({
        success: true,
        data: result
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update draft status.',
        error
      })
    }
  },

  async toggleDraft(req: Request, res: Response): Promise<void> {
    try {
      const result = await blogPostsService.toggleDraft(req.params.id)

      if (!result) {
        res.status(404).json({
          success: false,
          message: 'Blog post not found.'
        })
        return
      }

      res.status(200).json({
        success: true,
        data: result
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to toggle draft status.',
        error
      })
    }
  },

  async setFeatured(req: Request, res: Response): Promise<void> {
    try {
      const featured = toOptionalBoolean(req.body.featured)

      if (featured === undefined) {
        res.status(400).json({
          success: false,
          message: 'featured boolean is required.'
        })
        return
      }

      const result = await blogPostsService.setFeaturedStatus(req.params.id, featured)

      if (!result) {
        res.status(404).json({
          success: false,
          message: 'Blog post not found.'
        })
        return
      }

      res.status(200).json({
        success: true,
        data: result
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update featured status.',
        error
      })
    }
  },

  async toggleFeatured(req: Request, res: Response): Promise<void> {
    try {
      const result = await blogPostsService.toggleFeatured(req.params.id)

      if (!result) {
        res.status(404).json({
          success: false,
          message: 'Blog post not found.'
        })
        return
      }

      res.status(200).json({
        success: true,
        data: result
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to toggle featured status.',
        error
      })
    }
  },

  async setStaffPick(req: Request, res: Response): Promise<void> {
    try {
      const staffPick = toOptionalBoolean(req.body.staffPick)

      if (staffPick === undefined) {
        res.status(400).json({
          success: false,
          message: 'staffPick boolean is required.'
        })
        return
      }

      const result = await blogPostsService.setStaffPickStatus(req.params.id, staffPick)

      if (!result) {
        res.status(404).json({
          success: false,
          message: 'Blog post not found.'
        })
        return
      }

      res.status(200).json({
        success: true,
        data: result
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update staff pick status.',
        error
      })
    }
  },

  async toggleStaffPick(req: Request, res: Response): Promise<void> {
    try {
      const result = await blogPostsService.toggleStaffPick(req.params.id)

      if (!result) {
        res.status(404).json({
          success: false,
          message: 'Blog post not found.'
        })
        return
      }

      res.status(200).json({
        success: true,
        data: result
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to toggle staff pick status.',
        error
      })
    }
  },

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const post = await blogPostsService.getById(req.params.id)

      if (!post) {
        res.status(404).json({
          success: false,
          message: 'Blog post not found.'
        })
        return
      }

      res.status(200).json({
        success: true,
        data: post
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch blog post.',
        error
      })
    }
  },

  async getBySlug(req: Request, res: Response): Promise<void> {
    try {
      const post = await blogPostsService.getBySlug(req.params.slug)

      if (!post) {
        res.status(404).json({
          success: false,
          message: 'Blog post not found.'
        })
        return
      }

      res.status(200).json({
        success: true,
        data: post
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch blog post by slug.',
        error
      })
    }
  },

  async getPublishedBySlug(req: Request, res: Response): Promise<void> {
    try {
      const post = await blogPostsService.getPublishedBySlug(req.params.slug)

      if (!post) {
        res.status(404).json({
          success: false,
          message: 'Published blog post not found.'
        })
        return
      }

      res.status(200).json({
        success: true,
        data: post
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch published blog post by slug.',
        error
      })
    }
  },

  async getLatest(req: Request, res: Response): Promise<void> {
    try {
      const post = await blogPostsService.getLatest()

      if (!post) {
        res.status(404).json({
          success: false,
          message: 'No published blog posts found.'
        })
        return
      }

      res.status(200).json({
        success: true,
        data: post
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch latest blog post.',
        error
      })
    }
  },

    async fetchAll(req: Request, res: Response): Promise<void> {
    try {
      const posts = await blogPostsService.fetchAll(parseListOptions(req))

      res.status(200).json({
        success: true,
        data: posts
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch all blog posts.',
        error
      })
    }
  },

  async fetchAllPublished(req: Request, res: Response): Promise<void> {
    try {
      const posts = await blogPostsService.fetchAllPublished()

      res.status(200).json({
        success: true,
        data: posts
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch all published blog posts.',
        error
      })
    }
  },

  async existsById(req: Request, res: Response): Promise<void> {
    try {
      const result = await blogPostsService.existsById(req.params.id)

      res.status(200).json({
        success: true,
        data: result
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to check blog post existence by id.',
        error
      })
    }
  },

  async existsBySlug(req: Request, res: Response): Promise<void> {
    try {
      const excludeId = toOptionalString(req.query.excludeId)
      const result = await blogPostsService.existsBySlug(req.params.slug, excludeId)

      res.status(200).json({
        success: true,
        data: result
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to check blog post existence by slug.',
        error
      })
    }
  },

  async list(req: Request, res: Response): Promise<void> {
    try {
      const posts = await blogPostsService.list(parseListOptions(req))

      res.status(200).json({
        success: true,
        data: posts
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to list blog posts.',
        error
      })
    }
  },

  async listPaginated(req: Request, res: Response): Promise<void> {
    try {
      const result = await blogPostsService.listPaginated(parseListOptions(req))

      res.status(200).json({
        success: true,
        ...result
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to list paginated blog posts.',
        error
      })
    }
  },

  async listPublished(req: Request, res: Response): Promise<void> {
    try {
      const posts = await blogPostsService.listPublished()

      res.status(200).json({
        success: true,
        data: posts
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to list published blog posts.',
        error
      })
    }
  },

  async listPublishedSlugs(req: Request, res: Response): Promise<void> {
    try {
      const slugs = await blogPostsService.listPublishedSlugs()

      res.status(200).json({
        success: true,
        data: slugs
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to list published blog post slugs.',
        error
      })
    }
  },

  async listFeatured(req: Request, res: Response): Promise<void> {
    try {
      const posts = await blogPostsService.listFeatured()

      res.status(200).json({
        success: true,
        data: posts
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to list featured blog posts.',
        error
      })
    }
  },

  async listStaffPicks(req: Request, res: Response): Promise<void> {
    try {
      const posts = await blogPostsService.listStaffPicks()

      res.status(200).json({
        success: true,
        data: posts
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to list staff pick blog posts.',
        error
      })
    }
  },

  async listByTag(req: Request, res: Response): Promise<void> {
    try {
      const options = parseListOptions(req)
      delete options.tag

      const posts = await blogPostsService.listByTag(req.params.tag, options)

      res.status(200).json({
        success: true,
        data: posts
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to list blog posts by tag.',
        error
      })
    }
  },

  async listByAuthor(req: Request, res: Response): Promise<void> {
    try {
      const options = parseListOptions(req)
      delete options.author

      const posts = await blogPostsService.listByAuthor(req.params.author, options)

      res.status(200).json({
        success: true,
        data: posts
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to list blog posts by author.',
        error
      })
    }
  },

  async count(req: Request, res: Response): Promise<void> {
    try {
      const total = await blogPostsService.count(parseListOptions(req))

      res.status(200).json({
        success: true,
        data: {
          total
        }
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to count blog posts.',
        error
      })
    }
  }
}
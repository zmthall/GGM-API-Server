import type { Request, Response } from 'express'
import { blogPostsService } from '../services/blogPosts.services'
import { parseCreateBody, parseListOptions, parseUpdateBody, toOptionalDate } from '../helpers/requestParsers'

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

  async uploadThumbnail(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'Thumbnail file is required.'
        })
        return
      }

      const uploaded = await blogPostsService.uploadThumbnail(req.file)

      res.status(200).json({
        success: true,
        data: uploaded
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to upload blog thumbnail.',
        error
      })
    }
  },

  async uploadSeo(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'SEO image file is required.'
        })
        return
      }

      const uploaded = await blogPostsService.uploadSeo(req.file)

      res.status(200).json({
        success: true,
        data: uploaded
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to upload blog SEO image.',
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
        data: posts.data,
        pagination: posts.pagination
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
      const posts = await blogPostsService.listPublishedCardsPaginated(parseListOptions(req))

      res.status(200).json({
        success: true,
        data: posts.data,
        pagination: posts.pagination
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch all published blog posts.',
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
  
  async listSitemap(req: Request, res: Response): Promise<void> {
    try {
      const posts = await blogPostsService.listSitemap()

      res.status(200).json({
        success: true,
        data: posts
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to list sitemap blog posts.',
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

  async checkUniquePost(req: Request, res: Response): Promise<void> {
    try {
      const post = req.body?.post

      if (!post || typeof post !== 'object') {
        res.status(400).json({
          success: false,
          message: 'Missing post data.'
        })
        return
      }

      const result = await blogPostsService.checkUniquePost({
        id: post.id,
        slug: post.slug,
        title: post.title,
        canonicalUrl: post.canonicalUrl,
        excludeId: post.excludeId
      })

      res.status(200).json({
        success: true,
        unique: result.unique,
        match: result.match
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to check unique post.'

      const statusCode =
        error instanceof Error &&
        error.message === 'At least one of id, slug, title, or canonicalUrl is required.'
          ? 400
          : 500

      res.status(statusCode).json({
        success: false,
        message,
        error: statusCode === 500 ? error : undefined
      })
    }
  },

  async listRelatedPosts(req: Request, res: Response): Promise<void> {
    try {
      const rawLimit = Number(req.query.limit)
      const limit =
        Number.isFinite(rawLimit) && rawLimit > 0
          ? Math.min(Math.floor(rawLimit), 8)
          : 4

      const posts = await blogPostsService.listRelatedPosts(req.params.id, limit)

      res.status(200).json({
        success: true,
        data: posts
      })
    } catch (error: any) {
      if (error?.message === 'Blog post not found.') {
        res.status(404).json({
          success: false,
          message: 'Blog post not found.'
        })
        return
      }

      res.status(500).json({
        success: false,
        message: 'Failed to list related blog posts.',
        error
      })
    }
  }
}
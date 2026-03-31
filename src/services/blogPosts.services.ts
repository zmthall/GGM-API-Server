import {
  createBlogPost,
  deleteBlogPost,
  findMatchingBlogPost,
  getBlogPostById,
  getBlogPostBySlug,
  getLatestBlogPost,
  getPublishedBlogPostBySlug,
  listBlogPreviewsPaginated,
  listPublishedBlogCardsPaginated,
  listPublishedBlogPostSlugs,
  listRelatedBlogPosts,
  listStaffPickBlogPosts,
  publishBlogPost,
  unpublishBlogPost,
  updateBlogPost
} from '../helpers/database/blogPosts/blogPosts.db'
import type {
  BlogImageUploadResult,
  BlogPostCardRecord,
  BlogPostPreviewRecord,
  BlogPostRecord,
  BlogPostTinyRecord,
  BlogPostUpdateRecord,
  CheckUniquePostInput,
  CheckUniquePostResult,
  CreateBlogPostInput,
  ListBlogPostsOptions,
  PaginatedResult,
  RelatedBlogPostsQueryInput,
  UpdateBlogPostInput
} from '../types/blogPosts'

import { BLOG_THUMBNAILS_DIR, BLOG_SEO_DIR } from '../config/paths'
import { deleteBlogImage, saveBlogImage } from '../helpers/blogPostUploads'

export const blogPostsService = {
  async create(input: CreateBlogPostInput): Promise<BlogPostRecord> {
    return createBlogPost(input)
  },

  async update(id: string, input: UpdateBlogPostInput): Promise<BlogPostRecord | null> {
    const existingPost = await getBlogPostById(id)

    if (!existingPost) return null

    const updatedPost = await updateBlogPost(id, input)

    if (!updatedPost) return null

    const thumbnailChanged =
      existingPost.thumbnail &&
      updatedPost.thumbnail &&
      existingPost.thumbnail !== updatedPost.thumbnail

    const seoImageChanged =
      existingPost.seo_image &&
      updatedPost.seo_image &&
      existingPost.seo_image !== updatedPost.seo_image

    if (thumbnailChanged) {
      try {
        deleteBlogImage(existingPost.thumbnail, BLOG_THUMBNAILS_DIR, '/uploads/blog/thumbnails')
      } catch (error) {
        console.error('Failed to delete previous blog thumbnail:', error)
      }
    }

    if (seoImageChanged) {
      try {
        deleteBlogImage(existingPost.seo_image, BLOG_SEO_DIR, '/uploads/blog/seo')
      } catch (error) {
        console.error('Failed to delete previous blog SEO image:', error)
      }
    }

    return updatedPost
  },

  async remove(id: string): Promise<boolean> {
    const post = await getBlogPostById(id)

    if (!post) return false

    if (post.thumbnail) {
      deleteBlogImage(post.thumbnail, BLOG_THUMBNAILS_DIR, '/uploads/blog/thumbnails')
    }

    if (post.seo_image) {
      deleteBlogImage(post.seo_image, BLOG_SEO_DIR, '/uploads/blog/seo')
    }

    return deleteBlogPost(id)
  },

  async uploadThumbnail(file: Express.Multer.File): Promise<BlogImageUploadResult> {
    return saveBlogImage(file, BLOG_THUMBNAILS_DIR, '/uploads/blog/thumbnails')
  },

  async uploadSeo(file: Express.Multer.File): Promise<BlogImageUploadResult> {
    return saveBlogImage(file, BLOG_SEO_DIR, '/uploads/blog/seo')
  },

  async publish(id: string, publishTimestamp?: Date): Promise<BlogPostUpdateRecord | null> {
    return publishBlogPost(id, publishTimestamp)
  },

  async unpublish(id: string): Promise<BlogPostUpdateRecord | null> {
    return unpublishBlogPost(id)
  },

  async getById(id: string): Promise<BlogPostRecord | null> {
    return getBlogPostById(id)
  },

  async checkUniquePost(input: CheckUniquePostInput): Promise<CheckUniquePostResult> {
    const comparableInput = {
      id: input.id?.trim() || undefined,
      slug: input.slug?.trim() || undefined,
      title: input.title?.trim() || undefined,
      canonicalUrl: input.canonicalUrl?.trim() || undefined
    }

    const hasComparableValue = Object.values(comparableInput).some(Boolean)

    if (!hasComparableValue) {
      throw new Error('At least one of id, slug, title, or canonicalUrl is required.')
    }

    const match = await findMatchingBlogPost(comparableInput, input.excludeId?.trim() || undefined)

    return {
      unique: !match,
      match
    }
  },

  async getBySlug(slug: string): Promise<BlogPostRecord | null> {
    return getBlogPostBySlug(slug)
  },

  async getPublishedBySlug(slug: string): Promise<BlogPostRecord | null> {
    return getPublishedBlogPostBySlug(slug)
  },

  async getLatest(): Promise<BlogPostCardRecord | null> {
    return getLatestBlogPost()
  },

  async fetchAll(options: ListBlogPostsOptions = {}): Promise<PaginatedResult<BlogPostPreviewRecord>> {
    return listBlogPreviewsPaginated(options)
  },

  async listPublishedCardsPaginated(
    options: ListBlogPostsOptions = {}
  ): Promise<PaginatedResult<BlogPostCardRecord>> {
    return listPublishedBlogCardsPaginated(options)
  },

  async listPublishedSlugs(): Promise<string[]> {
    return listPublishedBlogPostSlugs()
  },

  async listStaffPicks(): Promise<BlogPostTinyRecord[]> {
    return listStaffPickBlogPosts()
  },

  async listRelatedPosts(id: string, limit = 4): Promise<BlogPostCardRecord[]> {
    const safeLimit = Number.isFinite(limit)
      ? Math.max(1, Math.min(8, Math.floor(limit)))
      : 4

    const currentPost = await getBlogPostById(id)

    if (!currentPost) {
      throw new Error('Blog post not found.')
    }

    const relatedInput: RelatedBlogPostsQueryInput = {
      id: currentPost.id,
      title: currentPost.title,
      summary: currentPost.summary,
      author: currentPost.author,
      tags: currentPost.tags
    }

    return listRelatedBlogPosts(relatedInput, safeLimit)
  }
}
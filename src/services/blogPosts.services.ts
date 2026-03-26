import {
  blogPostExistsById,
  countBlogPosts,
  createBlogPost,
  deleteBlogPost,
  findMatchingBlogPost,
  getBlogPostById,
  getBlogPostBySlug,
  getLatestBlogPost,
  getPublishedBlogPostBySlug,
  listBlogPosts,
  listBlogPostsByAuthor,
  listBlogPostsByTag,
  listBlogPostsPaginated,
  listBlogPreviewsPaginated,
  listFeaturedBlogPosts,
  listPublishedBlogCardsPaginated,
  listPublishedBlogPosts,
  listPublishedBlogPostSlugs,
  listRelatedBlogPosts,
  listStaffPickBlogPosts,
  publishBlogPost,
  publishedSlugExists,
  setBlogPostDraftStatus,
  setBlogPostFeaturedStatus,
  setBlogPostStaffPickStatus,
  slugExists,
  toggleBlogPostDraft,
  toggleBlogPostFeatured,
  toggleBlogPostStaffPick,
  unpublishBlogPost,
  updateBlogPost
} from '../helpers/database/blogPosts/blogPosts.db'
import type {
  BlogImageUploadResult,
  BlogPostCardRecord,
  BlogPostExistsResult,
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
  SlugExistsResult,
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

  async setDraftStatus(id: string, draft: boolean): Promise<BlogPostRecord | null> {
    return setBlogPostDraftStatus(id, draft)
  },

  async toggleDraft(id: string): Promise<BlogPostRecord | null> {
    return toggleBlogPostDraft(id)
  },

  async setFeaturedStatus(id: string, featured: boolean): Promise<BlogPostRecord | null> {
    return setBlogPostFeaturedStatus(id, featured)
  },

  async toggleFeatured(id: string): Promise<BlogPostRecord | null> {
    return toggleBlogPostFeatured(id)
  },

  async setStaffPickStatus(id: string, staffPick: boolean): Promise<BlogPostRecord | null> {
    return setBlogPostStaffPickStatus(id, staffPick)
  },

  async toggleStaffPick(id: string): Promise<BlogPostRecord | null> {
    return toggleBlogPostStaffPick(id)
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
    return listBlogPreviewsPaginated(options);
  },

  async fetchAllPublished(): Promise<BlogPostRecord[]> {
    return listPublishedBlogPosts()
  },

  async existsById(id: string): Promise<BlogPostExistsResult> {
    const exists = await blogPostExistsById(id)
    return { exists }
  },

  async existsBySlug(slug: string, excludeId?: string): Promise<SlugExistsResult> {
    const exists = await slugExists(slug, excludeId)
    return { exists }
  },

  async existsPublishedBySlug(slug: string, excludeId?: string): Promise<SlugExistsResult> {
    const exists = await publishedSlugExists(slug, excludeId)
    return { exists }
  },

  async list(options: ListBlogPostsOptions = {}): Promise<BlogPostRecord[]> {
    return listBlogPosts(options)
  },

  async listPaginated(
    options: ListBlogPostsOptions = {}
  ): Promise<PaginatedResult<BlogPostRecord>> {
    return listBlogPostsPaginated(options)
  },

  async listPublished(): Promise<BlogPostRecord[]> {
    return listPublishedBlogPosts()
  },

  async listPublishedCardsPaginated(
    options: ListBlogPostsOptions = {}
  ): Promise<PaginatedResult<BlogPostCardRecord>> {
    return listPublishedBlogCardsPaginated(options)
  },

  async listPublishedSlugs(): Promise<string[]> {
    return listPublishedBlogPostSlugs()
  },

  async listFeatured(): Promise<BlogPostRecord[]> {
    return listFeaturedBlogPosts()
  },

  async listStaffPicks(): Promise<BlogPostTinyRecord[]> {
    return listStaffPickBlogPosts()
  },

  async listByTag(
    tag: string,
    options: Omit<ListBlogPostsOptions, 'tag'> = {}
  ): Promise<BlogPostRecord[]> {
    return listBlogPostsByTag(tag, options)
  },

  async listByAuthor(
    author: string,
    options: Omit<ListBlogPostsOptions, 'author'> = {}
  ): Promise<BlogPostRecord[]> {
    return listBlogPostsByAuthor(author, options)
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
  },

  async count(options: ListBlogPostsOptions = {}): Promise<number> {
    return countBlogPosts(options)
  }
}

import {
  blogPostExistsById,
  countBlogPosts,
  createBlogPost,
  deleteBlogPost,
  getBlogPostById,
  getBlogPostBySlug,
  getLatestBlogPost,
  getPublishedBlogPostBySlug,
  listBlogPostCards,
  listBlogPosts,
  listBlogPostsByAuthor,
  listBlogPostsByTag,
  listBlogPostsPaginated,
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
  BlogPostCardRecord,
  BlogPostRecord,
  BlogPostTinyRecord,
  CreateBlogPostInput,
  ListBlogPostsOptions,
  PaginatedResult,
  RelatedBlogPostsQueryInput,
  UpdateBlogPostInput
} from '../types/blogPosts'

export interface BlogPostExistsResult {
  exists: boolean
}

export interface SlugExistsResult {
  exists: boolean
}

export const blogPostsService = {
  async create(input: CreateBlogPostInput): Promise<BlogPostRecord> {
    return createBlogPost(input)
  },

  async update(id: string, input: UpdateBlogPostInput): Promise<BlogPostRecord | null> {
    return updateBlogPost(id, input)
  },

  async remove(id: string): Promise<boolean> {
    return deleteBlogPost(id)
  },

  async publish(id: string, publishTimestamp?: Date): Promise<BlogPostRecord | null> {
    return publishBlogPost(id, publishTimestamp)
  },

  async unpublish(id: string): Promise<BlogPostRecord | null> {
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

  async getBySlug(slug: string): Promise<BlogPostRecord | null> {
    return getBlogPostBySlug(slug)
  },

  async getPublishedBySlug(slug: string): Promise<BlogPostRecord | null> {
    return getPublishedBlogPostBySlug(slug)
  },

  async getLatest(): Promise<BlogPostCardRecord | null> {
    return getLatestBlogPost()
  },

    async fetchAll(options: ListBlogPostsOptions = {}): Promise<BlogPostRecord[]> {
    return listBlogPosts(options)
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

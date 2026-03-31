import test, { after, before } from 'node:test'
import assert from 'node:assert/strict'

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
  BlogPostCardRecord,
  BlogPostPreviewRecord,
  BlogPostTinyRecord,
  RelatedBlogPostsQueryInput
} from '../types/blogPosts'

const TEST_ID = `test-blog-${Date.now()}`
const TEST_SLUG = `test-blog-slug-${Date.now()}`
const UPDATED_SLUG = `updated-test-blog-slug-${Date.now()}`
const RELATED_ID = `test-related-blog-${Date.now()}`
const RELATED_SLUG = `test-related-blog-slug-${Date.now()}`

before(async () => {
  await deleteBlogPost(TEST_ID).catch(() => undefined)
  await deleteBlogPost(RELATED_ID).catch(() => undefined)

  await createBlogPost({
    id: TEST_ID,
    slug: TEST_SLUG,
    title: 'Primary Test Blog Post',
    summary: 'Primary summary for testing.',
    content: 'Primary content for testing related and CRUD behavior.',
    author: 'Zachary Thallas',
    tags: ['testing', 'blog', 'primary'],
    thumbnail: '',
    thumbnailAlt: '',
    thumbnailWidth: null,
    thumbnailHeight: null,
    staffPick: true,
    featured: false,
    readTime: 4,
    draft: true,
    published: false,
    publishTimestamp: null,
    seoTitle: 'Primary SEO Title',
    seoDescription: 'Primary SEO Description',
    seoImage: '',
    canonicalUrl: `/news/blog/post/${TEST_SLUG}`
  })

  await createBlogPost({
    id: RELATED_ID,
    slug: RELATED_SLUG,
    title: 'Related Test Blog Post',
    summary: 'Related summary for testing.',
    content: 'Related content for testing related post queries.',
    author: 'Zachary Thallas',
    tags: ['testing', 'blog', 'related'],
    thumbnail: '',
    thumbnailAlt: '',
    thumbnailWidth: null,
    thumbnailHeight: null,
    staffPick: false,
    featured: false,
    readTime: 3,
    draft: false,
    published: true,
    publishTimestamp: new Date(),
    seoTitle: 'Related SEO Title',
    seoDescription: 'Related SEO Description',
    seoImage: '',
    canonicalUrl: `/news/blog/post/${RELATED_SLUG}`
  })
})

after(async () => {
  await deleteBlogPost(TEST_ID).catch(() => undefined)
  await deleteBlogPost(RELATED_ID).catch(() => undefined)
})

test('getBlogPostById returns the created draft post', async () => {
  const post = await getBlogPostById(TEST_ID)

  assert.ok(post)
  assert.equal(post.id, TEST_ID)
  assert.equal(post.slug, TEST_SLUG)
  assert.equal(post.title, 'Primary Test Blog Post')
  assert.equal(post.draft, true)
  assert.equal(post.published, false)
})

test('getBlogPostBySlug returns the created draft post', async () => {
  const post = await getBlogPostBySlug(TEST_SLUG)

  assert.ok(post)
  assert.equal(post.id, TEST_ID)
  assert.equal(post.slug, TEST_SLUG)
})

test('getPublishedBlogPostBySlug does not return draft/unpublished post', async () => {
  const post = await getPublishedBlogPostBySlug(TEST_SLUG)

  assert.equal(post, null)
})

test('findMatchingBlogPost finds by slug', async () => {
  const post = await findMatchingBlogPost({
    slug: TEST_SLUG
  })

  assert.ok(post)
  assert.equal(post?.id, TEST_ID)
})

test('updateBlogPost updates slug and title', async () => {
  const updated = await updateBlogPost(TEST_ID, {
    slug: UPDATED_SLUG,
    title: 'Updated Primary Test Blog Post'
  })

  assert.ok(updated)
  assert.equal(updated?.slug, UPDATED_SLUG)
  assert.equal(updated?.title, 'Updated Primary Test Blog Post')
})

test('publishBlogPost publishes the post', async () => {
  const published = await publishBlogPost(TEST_ID)

  assert.ok(published)
  assert.equal(published?.id, TEST_ID)
  assert.equal(published?.published, true)
  assert.equal(published?.draft, false)
  assert.ok(published?.publish_timestamp)
})

test('getPublishedBlogPostBySlug returns post after publish', async () => {
  const post = await getPublishedBlogPostBySlug(UPDATED_SLUG)

  assert.ok(post)
  assert.equal(post?.id, TEST_ID)
  assert.equal(post?.published, true)
  assert.equal(post?.draft, false)
})

test('listPublishedBlogCardsPaginated includes published test post', async () => {
  const result = await listPublishedBlogCardsPaginated({
    page: 1,
    pageSize: 25
  })

  assert.ok(Array.isArray(result.data))
  assert.ok(result.pagination.totalItems >= 1)

  const found = result.data.find((post: BlogPostCardRecord) => post.id === TEST_ID)
  assert.ok(found)
  assert.equal(found?.slug, UPDATED_SLUG)
})

test('listPublishedBlogPostSlugs includes published test slug', async () => {
  const slugs = await listPublishedBlogPostSlugs()

  assert.ok(Array.isArray(slugs))
  assert.ok(slugs.includes(UPDATED_SLUG))
})

test('listBlogPreviewsPaginated includes test post', async () => {
  const result = await listBlogPreviewsPaginated({
    page: 1,
    pageSize: 25
  })

  assert.ok(Array.isArray(result.data))

  const found = result.data.find((post: BlogPostPreviewRecord) => post.id === TEST_ID)
  assert.ok(found)
  assert.equal(found?.slug, UPDATED_SLUG)
})

test('listStaffPickBlogPosts can include published staff pick test post', async () => {
  const posts = await listStaffPickBlogPosts()

  assert.ok(Array.isArray(posts))

  const found = posts.find((post: BlogPostTinyRecord) => post.id === TEST_ID)
  assert.ok(found)
})

test('getLatestBlogPost returns a published post', async () => {
  const latest = await getLatestBlogPost()

  assert.ok(latest)
  assert.equal(typeof latest?.id, 'string')
  assert.equal(typeof latest?.slug, 'string')
})

test('listRelatedBlogPosts returns related published posts', async () => {
  const current = await getBlogPostById(TEST_ID)

  assert.ok(current)

  const relatedInput: RelatedBlogPostsQueryInput = {
    id: current!.id,
    title: current!.title,
    summary: current!.summary,
    author: current!.author,
    tags: current!.tags
  }

  const related = await listRelatedBlogPosts(relatedInput, 4)

  assert.ok(Array.isArray(related))

  const found = related.find((post: BlogPostCardRecord) => post.id === RELATED_ID)
  assert.ok(found)
})

test('unpublishBlogPost unpublishes the post', async () => {
  const unpublished = await unpublishBlogPost(TEST_ID)

  assert.ok(unpublished)
  assert.equal(unpublished?.id, TEST_ID)
  assert.equal(unpublished?.published, false)
  assert.equal(unpublished?.publish_timestamp, null)
})

test('published lookup fails again after unpublish', async () => {
  const post = await getPublishedBlogPostBySlug(UPDATED_SLUG)

  assert.equal(post, null)
})
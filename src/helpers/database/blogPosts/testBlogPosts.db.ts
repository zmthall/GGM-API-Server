import { postgresPool } from '../../../config/postgres'
import {
  createBlogPost,
  getBlogPostById,
  getBlogPostBySlug,
  getPublishedBlogPostBySlug,
  slugExists,
  listBlogPosts,
  listBlogPostsWithOptions,
  listPublishedBlogPosts,
  listPublishedBlogPostSlugs,
  listStaffPickBlogPosts,
  updateBlogPost,
  deleteBlogPost
} from './blogPosts.db'

const TEST_ID = 'test-blog-post-001'
const TEST_SLUG = 'test-blog-post'
const UPDATED_SLUG = 'updated-test-blog-post'

const run = async (): Promise<void> => {
  try {
    console.log('\n--- CREATE ---')

    const created = await createBlogPost({
      id: TEST_ID,
      slug: TEST_SLUG,
      title: 'Test Blog Post',
      description: 'A short test description.',
      summary: 'A summary for the test post.',
      author: 'Zachary Thallas',
      draft: false,
      staffPick: true,
      date: new Date('2099-01-01T12:00:00.000Z'),
      published: '2099-01-01',
      readTime: 7,
      thumbnail: '/images/blog/test-post.png',
      thumbnailAlt: 'Test thumbnail',
      thumbnailWidth: 600,
      thumbnailHeight: 300,
      bodyMarkdown: '## Test Heading\n\nThis is a test markdown body.',
      sourceFile: `---
title: "Test Blog Post"
summary: "A summary for the test post."
---
## Test Heading

This is a test markdown body.`,
      sourceFilePath: 'content/blog/test-blog-post.md',
      sourceContentId: 'content:blog:test-blog-post.md',
      sourcePath: '/news/blog/post/test-blog-post',
      tags: ['Test', 'Pueblo'],
      rawFrontmatter: {
        title: 'Test Blog Post',
        summary: 'A summary for the test post.'
      },
      rawDocument: {
        migratedFrom: 'nuxt-content'
      }
    })

    console.log(created)

    console.log('\n--- GET BY ID ---')

    const byId = await getBlogPostById(TEST_ID)
    console.log(byId)

    console.log('\n--- GET BY SLUG ---')

    const bySlug = await getBlogPostBySlug(TEST_SLUG)
    console.log(bySlug)

    console.log('\n--- GET PUBLISHED BY SLUG (FUTURE PUBLISHED, SHOULD BE NULL) ---')

    const futurePublishedBySlug = await getPublishedBlogPostBySlug(TEST_SLUG)
    console.log('Should be null:', futurePublishedBySlug)

    console.log('\n--- SLUG EXISTS ---')

    const slugTaken = await slugExists(TEST_SLUG)
    console.log('Slug exists:', slugTaken)

    console.log('\n--- LIST ALL POSTS ---')

    const allPosts = await listBlogPosts()
    console.log(allPosts)

    console.log('\n--- LIST POSTS WITH OPTIONS (ADMIN / NO FILTERS) ---')

    const allWithOptions = await listBlogPostsWithOptions()
    console.log(allWithOptions)

    console.log('\n--- LIST POSTS WITH OPTIONS (PUBLISHED ONLY) ---')

    const publishedOnlyWithOptions = await listBlogPostsWithOptions({ publishedOnly: true })
    console.log(publishedOnlyWithOptions)

    console.log('\n--- LIST POSTS WITH OPTIONS (PUBLISHED + STAFF PICK ONLY) ---')

    const publishedStaffPickWithOptions = await listBlogPostsWithOptions({
      publishedOnly: true,
      staffPickOnly: true
    })
    console.log(publishedStaffPickWithOptions)

    console.log('\n--- LIST PUBLISHED POSTS (FUTURE POST SHOULD NOT APPEAR) ---')

    const publishedPosts = await listPublishedBlogPosts()
    console.log(publishedPosts)

    console.log('\n--- LIST PUBLISHED BLOG POST SLUGS (FUTURE POST SHOULD NOT APPEAR) ---')

    const publishedSlugs = await listPublishedBlogPostSlugs()
    console.log(publishedSlugs)

    console.log('\n--- LIST STAFF PICKS (FUTURE POST SHOULD NOT APPEAR) ---')

    const staffPicks = await listStaffPickBlogPosts()
    console.log(staffPicks)

    console.log('\n--- UPDATE TO TODAY SO IT BECOMES PUBLIC ---')

    const today = new Date().toISOString().slice(0, 10)

    const publishedUpdate = await updateBlogPost(TEST_ID, {
      published: today
    })

    console.log(publishedUpdate)

    console.log('\n--- GET PUBLISHED BY SLUG (NOW SHOULD EXIST) ---')

    const nowPublishedBySlug = await getPublishedBlogPostBySlug(TEST_SLUG)
    console.log(nowPublishedBySlug)

    console.log('\n--- LIST PUBLISHED POSTS (NOW SHOULD INCLUDE TEST POST) ---')

    const publishedPostsAfterDateFix = await listPublishedBlogPosts()
    console.log(publishedPostsAfterDateFix)

    console.log('\n--- LIST PUBLISHED SLUGS (NOW SHOULD INCLUDE TEST SLUG) ---')

    const publishedSlugsAfterDateFix = await listPublishedBlogPostSlugs()
    console.log(publishedSlugsAfterDateFix)

    console.log('\n--- LIST STAFF PICKS (NOW SHOULD INCLUDE TEST POST) ---')

    const staffPicksAfterDateFix = await listStaffPickBlogPosts()
    console.log(staffPicksAfterDateFix)

    console.log('\n--- UPDATE CORE FIELDS ---')

    const updated = await updateBlogPost(TEST_ID, {
      title: 'Updated Test Blog Post',
      slug: UPDATED_SLUG,
      staffPick: false,
      bodyMarkdown: '## Updated Heading\n\nUpdated markdown content.'
    })

    console.log(updated)

    console.log('\n--- GET UPDATED BY NEW SLUG ---')

    const byUpdatedSlug = await getBlogPostBySlug(UPDATED_SLUG)
    console.log(byUpdatedSlug)

    console.log('\n--- GET PUBLISHED BY UPDATED SLUG ---')

    const publishedByUpdatedSlug = await getPublishedBlogPostBySlug(UPDATED_SLUG)
    console.log(publishedByUpdatedSlug)

    console.log('\n--- SLUG EXISTS FOR UPDATED SLUG ---')

    const updatedSlugExists = await slugExists(UPDATED_SLUG)
    console.log('Updated slug exists:', updatedSlugExists)

    console.log('\n--- DELETE ---')

    const deleted = await deleteBlogPost(TEST_ID)
    console.log('Deleted:', deleted)

    console.log('\n--- VERIFY DELETE BY ID ---')

    const verifyById = await getBlogPostById(TEST_ID)
    console.log('Should be null:', verifyById)

    console.log('\n--- VERIFY DELETE BY SLUG ---')

    const verifyBySlug = await getBlogPostBySlug(UPDATED_SLUG)
    console.log('Should be null:', verifyBySlug)
  } catch (error) {
    console.error('Test failed:', error)
    process.exitCode = 1
  } finally {
    await postgresPool.end()
  }
}

void run()
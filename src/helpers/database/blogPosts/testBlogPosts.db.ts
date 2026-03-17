import { postgresPool } from '../../../config/postgres'
import {
  blogPostExistsById,
  countBlogPosts,
  createBlogPost,
  deleteBlogPost,
  getBlogPostById,
  getBlogPostBySlug,
  getLatestBlogPost,
  getPublishedBlogPostBySlug,
  listBlogPosts,
  listBlogPostsByAuthor,
  listBlogPostsByTag,
  listBlogPostsPaginated,
  listFeaturedBlogPosts,
  listPublishedBlogPosts,
  listPublishedBlogPostSlugs,
  listStaffPickBlogPosts,
  publishBlogPost,
  setBlogPostDraftStatus,
  setBlogPostFeaturedStatus,
  setBlogPostStaffPickStatus,
  slugExists,
  toggleBlogPostDraft,
  toggleBlogPostFeatured,
  toggleBlogPostStaffPick,
  unpublishBlogPost,
  updateBlogPost
} from './blogPosts.db'

const TEST_ID = 'test-blog-post-001'
const TEST_SLUG = 'test-blog-post'
const UPDATED_SLUG = 'updated-test-blog-post'

const logSection = (title: string): void => {
  console.log(`\n--- ${title} ---`)
}

const assert = (condition: unknown, message: string): void => {
  if (!condition) {
    throw new Error(message)
  }
}

const cleanupTestPosts = async (): Promise<void> => {
  const possibleSlugs = [TEST_SLUG, UPDATED_SLUG]

  for (const slug of possibleSlugs) {
    const existing = await getBlogPostBySlug(slug)
    if (existing) {
      await deleteBlogPost(existing.id)
    }
  }

  const existingById = await getBlogPostById(TEST_ID)
  if (existingById) {
    await deleteBlogPost(existingById.id)
  }
}

const run = async (): Promise<void> => {
  try {
    await cleanupTestPosts()

    logSection('CREATE')

    const created = await createBlogPost({
      id: TEST_ID,
      slug: TEST_SLUG,
      title: 'Test Blog Post',
      summary: 'A summary for the test post.',
      content: '## Test Heading\n\nThis is a test blog content body.',
      author: 'Zachary Thallas',
      tags: ['Test', 'Pueblo'],
      thumbnail: '/images/blog/test-post.png',
      thumbnailAlt: 'Test thumbnail',
      thumbnailWidth: 600,
      thumbnailHeight: 300,
      staffPick: true,
      featured: false,
      readTime: 7,
      draft: true,
      published: false,
      publishTimestamp: null,
      seoTitle: 'Test SEO Title',
      seoDescription: 'Test SEO description.',
      seoImage: '/images/blog/test-seo-image.png',
      canonicalUrl: 'https://www.goldengatemanor.com/news/blog/post/test-blog-post'
    })

    console.log(created)

    assert(created.id === TEST_ID, 'Create failed: wrong id')
    assert(created.slug === TEST_SLUG, 'Create failed: wrong slug')
    assert(created.draft === true, 'Create failed: draft should be true')
    assert(created.published === false, 'Create failed: published should be false')

    logSection('EXISTS BY ID')

    const existsById = await blogPostExistsById(TEST_ID)
    console.log('Exists by id:', existsById)
    assert(existsById === true, 'blogPostExistsById should be true after create')

    logSection('GET BY ID')

    const byId = await getBlogPostById(TEST_ID)
    console.log(byId)
    assert(byId?.id === TEST_ID, 'getBlogPostById failed')

    logSection('GET BY SLUG')

    const bySlug = await getBlogPostBySlug(TEST_SLUG)
    console.log(bySlug)
    assert(bySlug?.slug === TEST_SLUG, 'getBlogPostBySlug failed')

    logSection('GET PUBLISHED BY SLUG (SHOULD BE NULL WHILE DRAFT/UNPUBLISHED)')

    const unpublishedBySlug = await getPublishedBlogPostBySlug(TEST_SLUG)
    console.log('Should be null:', unpublishedBySlug)
    assert(unpublishedBySlug === null, 'Unpublished draft should not be publicly available')

    logSection('SLUG EXISTS')

    const slugTaken = await slugExists(TEST_SLUG)
    console.log('Slug exists:', slugTaken)
    assert(slugTaken === true, 'slugExists should be true')

    logSection('LIST ALL POSTS')

    const allPosts = await listBlogPosts()
    console.log(allPosts)
    assert(allPosts.some(post => post.id === TEST_ID), 'Created post should appear in listBlogPosts')

    logSection('COUNT ALL POSTS')

    const totalCount = await countBlogPosts()
    console.log('Total count:', totalCount)
    assert(totalCount >= 1, 'countBlogPosts should be at least 1 after create')

    logSection('LIST PAGINATED')

    const paginated = await listBlogPostsPaginated({
      page: 1,
      pageSize: 10
    })

    console.log(paginated)
    assert(Array.isArray(paginated.data), 'Paginated result should have data array')
    assert(
      paginated.data.some(post => post.id === TEST_ID),
      'Created post should appear in paginated results'
    )

    logSection('LIST BY TAG')

    const byTag = await listBlogPostsByTag('Test')
    console.log(byTag)
    assert(byTag.some(post => post.id === TEST_ID), 'Post should appear in tag filter')

    logSection('LIST BY AUTHOR')

    const byAuthor = await listBlogPostsByAuthor('Zachary Thallas')
    console.log(byAuthor)
    assert(byAuthor.some(post => post.id === TEST_ID), 'Post should appear in author filter')

    logSection('LIST PUBLISHED POSTS (SHOULD NOT INCLUDE TEST POST YET)')

    const publishedPostsBeforePublish = await listPublishedBlogPosts()
    console.log(publishedPostsBeforePublish)
    assert(
      !publishedPostsBeforePublish.some(post => post.id === TEST_ID),
      'Draft/unpublished post should not appear in published list'
    )

    logSection('LIST PUBLISHED SLUGS (SHOULD NOT INCLUDE TEST SLUG YET)')

    const publishedSlugsBeforePublish = await listPublishedBlogPostSlugs()
    console.log(publishedSlugsBeforePublish)
    assert(
      !publishedSlugsBeforePublish.includes(TEST_SLUG),
      'Draft/unpublished slug should not appear in public slug list'
    )

    logSection('LIST STAFF PICKS (PUBLISHED ONLY VERSION SHOULD NOT INCLUDE TEST POST YET)')

    const staffPicksBeforePublish = await listStaffPickBlogPosts()
    console.log(staffPicksBeforePublish)
    assert(
      !staffPicksBeforePublish.some(post => post.id === TEST_ID),
      'Draft/unpublished staff pick should not appear in public staff picks'
    )

    logSection('LIST FEATURED POSTS (SHOULD NOT INCLUDE TEST POST YET)')

    const featuredBeforePublish = await listFeaturedBlogPosts()
    console.log(featuredBeforePublish)
    assert(
      !featuredBeforePublish.some(post => post.id === TEST_ID),
      'Draft/unpublished featured post should not appear in public featured list'
    )

    logSection('UPDATE CORE FIELDS')

    const updated = await updateBlogPost(TEST_ID, {
      title: 'Updated Test Blog Post',
      slug: UPDATED_SLUG,
      summary: 'Updated summary for the test post.',
      content: '## Updated Heading\n\nUpdated blog content.',
      featured: true,
      seoTitle: 'Updated SEO Title'
    })

    console.log(updated)

    assert(updated !== null, 'updateBlogPost returned null')
    assert(updated?.title === 'Updated Test Blog Post', 'Title did not update')
    assert(updated?.slug === UPDATED_SLUG, 'Slug did not update')
    assert(updated?.featured === true, 'Featured did not update')

    logSection('GET UPDATED BY NEW SLUG')

    const byUpdatedSlug = await getBlogPostBySlug(UPDATED_SLUG)
    console.log(byUpdatedSlug)
    assert(byUpdatedSlug?.slug === UPDATED_SLUG, 'Updated slug lookup failed')

    logSection('OLD SLUG SHOULD NO LONGER EXIST')

    const oldSlugStillExists = await slugExists(TEST_SLUG)
    console.log('Old slug exists:', oldSlugStillExists)
    assert(oldSlugStillExists === false, 'Old slug should no longer exist')

    logSection('NEW SLUG SHOULD EXIST')

    const newSlugExists = await slugExists(UPDATED_SLUG)
    console.log('New slug exists:', newSlugExists)
    assert(newSlugExists === true, 'Updated slug should exist')

    logSection('SET DRAFT STATUS FALSE')

    const setDraftFalse = await setBlogPostDraftStatus(TEST_ID, false)
    console.log(setDraftFalse)
    assert(setDraftFalse?.draft === false, 'setBlogPostDraftStatus(false) failed')

    logSection('PUBLISH')

    const published = await publishBlogPost(TEST_ID)
    console.log(published)
    assert(published?.published === true, 'publishBlogPost failed')
    assert(published?.draft === false, 'publishBlogPost should force draft false')
    assert(published?.publish_timestamp != null, 'publishBlogPost should set publish_timestamp')

    logSection('GET PUBLISHED BY UPDATED SLUG (NOW SHOULD EXIST)')

    const publicBySlug = await getPublishedBlogPostBySlug(UPDATED_SLUG)
    console.log(publicBySlug)
    assert(publicBySlug?.id === TEST_ID, 'Published post should be returned publicly')

    logSection('LIST PUBLISHED POSTS (NOW SHOULD INCLUDE TEST POST)')

    const publishedPostsAfterPublish = await listPublishedBlogPosts()
    console.log(publishedPostsAfterPublish)
    assert(
      publishedPostsAfterPublish.some(post => post.id === TEST_ID),
      'Published post should appear in published list'
    )

    logSection('LIST PUBLISHED SLUGS (NOW SHOULD INCLUDE UPDATED SLUG)')

    const publishedSlugsAfterPublish = await listPublishedBlogPostSlugs()
    console.log(publishedSlugsAfterPublish)
    assert(
      publishedSlugsAfterPublish.includes(UPDATED_SLUG),
      'Published slug list should include updated slug'
    )

    logSection('GET LATEST BLOG POST')

    const latestBlogPost = await getLatestBlogPost()
    console.log(latestBlogPost)
    assert(latestBlogPost !== null, 'getLatestBlogPost should return a post after publish')
    assert(latestBlogPost?.id === TEST_ID, 'Latest blog post should be the test post')

    logSection('LIST STAFF PICKS (NOW SHOULD INCLUDE TEST POST)')

    const staffPicksAfterPublish = await listStaffPickBlogPosts()
    console.log(staffPicksAfterPublish)
    assert(
      staffPicksAfterPublish.some(post => post.id === TEST_ID),
      'Published staff pick should appear in public staff picks'
    )

    logSection('LIST FEATURED POSTS (NOW SHOULD INCLUDE TEST POST)')

    const featuredAfterPublish = await listFeaturedBlogPosts()
    console.log(featuredAfterPublish)
    assert(
      featuredAfterPublish.some(post => post.id === TEST_ID),
      'Published featured post should appear in public featured posts'
    )

    logSection('TOGGLE FEATURED')

    const toggledFeaturedOff = await toggleBlogPostFeatured(TEST_ID)
    console.log(toggledFeaturedOff)
    assert(toggledFeaturedOff?.featured === false, 'toggleBlogPostFeatured should flip to false')

    logSection('SET FEATURED STATUS TRUE')

    const setFeaturedTrue = await setBlogPostFeaturedStatus(TEST_ID, true)
    console.log(setFeaturedTrue)
    assert(setFeaturedTrue?.featured === true, 'setBlogPostFeaturedStatus(true) failed')

    logSection('TOGGLE STAFF PICK')

    const toggledStaffPickOff = await toggleBlogPostStaffPick(TEST_ID)
    console.log(toggledStaffPickOff)
    assert(toggledStaffPickOff?.staff_pick === false, 'toggleBlogPostStaffPick should flip to false')

    logSection('SET STAFF PICK STATUS TRUE')

    const setStaffPickTrue = await setBlogPostStaffPickStatus(TEST_ID, true)
    console.log(setStaffPickTrue)
    assert(setStaffPickTrue?.staff_pick === true, 'setBlogPostStaffPickStatus(true) failed')

    logSection('TOGGLE DRAFT ON')

    const toggledDraftOn = await toggleBlogPostDraft(TEST_ID)
    console.log(toggledDraftOn)
    assert(toggledDraftOn?.draft === true, 'toggleBlogPostDraft should flip to true')

    logSection('GET PUBLISHED BY SLUG AFTER DRAFT TRUE (SHOULD BE NULL)')

    const publicAfterDraftTrue = await getPublishedBlogPostBySlug(UPDATED_SLUG)
    console.log('Should be null:', publicAfterDraftTrue)
    assert(publicAfterDraftTrue === null, 'Draft=true post should not be public')

    logSection('SET DRAFT STATUS FALSE AGAIN')

    const setDraftFalseAgain = await setBlogPostDraftStatus(TEST_ID, false)
    console.log(setDraftFalseAgain)
    assert(setDraftFalseAgain?.draft === false, 'setBlogPostDraftStatus(false) failed again')

    logSection('UNPUBLISH')

    const unpublished = await unpublishBlogPost(TEST_ID)
    console.log(unpublished)
    assert(unpublished?.published === false, 'unpublishBlogPost failed')
    assert(unpublished?.publish_timestamp === null, 'unpublishBlogPost should clear publish_timestamp')

    logSection('GET PUBLISHED BY SLUG AFTER UNPUBLISH (SHOULD BE NULL)')

    const publicAfterUnpublish = await getPublishedBlogPostBySlug(UPDATED_SLUG)
    console.log('Should be null:', publicAfterUnpublish)
    assert(publicAfterUnpublish === null, 'Unpublished post should not be public')

    logSection('DELETE')

    const deleted = await deleteBlogPost(TEST_ID)
    console.log('Deleted:', deleted)
    assert(deleted === true, 'deleteBlogPost should return true')

    logSection('VERIFY DELETE BY ID')

    const verifyById = await getBlogPostById(TEST_ID)
    console.log('Should be null:', verifyById)
    assert(verifyById === null, 'Deleted post should not exist by id')

    logSection('VERIFY DELETE BY SLUG')

    const verifyBySlug = await getBlogPostBySlug(UPDATED_SLUG)
    console.log('Should be null:', verifyBySlug)
    assert(verifyBySlug === null, 'Deleted post should not exist by slug')

    logSection('VERIFY EXISTS BY ID FALSE')

    const existsAfterDelete = await blogPostExistsById(TEST_ID)
    console.log('Exists after delete:', existsAfterDelete)
    assert(existsAfterDelete === false, 'blogPostExistsById should be false after delete')

    console.log('\nAll blog post DB tests passed.')
  } catch (error) {
    console.error('Test failed:', error)
    process.exitCode = 1
  } finally {
    await cleanupTestPosts().catch(() => {})
    await postgresPool.end()
  }
}

void run()
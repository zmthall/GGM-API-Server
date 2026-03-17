import {
  createBlogPost,
  deleteBlogPost,
  getBlogPostById,
  listBlogPosts
} from './blogPosts.db'

import type { CreateBlogPostInput } from '../../../types/blogPosts'

const TOTAL_TEST_POSTS = 30

const TEST_POST_IDS = Array.from({ length: TOTAL_TEST_POSTS }, (_, index) =>
  `seed-blog-post-${String(index + 1).padStart(3, '0')}`
) as string[]

const AUTHORS = [
  'Zachary Thallas',
  'Golden Gate Manor Team',
  'Golden Gate Transportation Team',
  'Golden Gate Medical Supply Team'
] as const

const TAG_GROUPS = [
  ['Transportation', 'Medical Ride'],
  ['Accessibility', 'Wheelchair'],
  ['Medical Equipment', 'Caregiver'],
  ['Senior Care', 'Support'],
  ['NEMT', 'Scheduling'],
  ['Safety', 'Community'],
  ['Testing', 'Workflow'],
  ['Healthcare', 'Education']
] as const

const THUMBNAILS = [
  {
    path: '/images/blog/test-thumbnail-01.jpg',
    alt: 'Transportation themed test blog image'
  },
  {
    path: '/images/blog/test-thumbnail-02.jpg',
    alt: 'Wheelchair accessible transportation test image'
  },
  {
    path: '/images/blog/test-thumbnail-03.jpg',
    alt: 'Medical equipment themed test blog image'
  },
  {
    path: '/images/blog/test-thumbnail-04.jpg',
    alt: 'Healthcare and caregiver themed test blog image'
  }
] as const

const logSection = (title: string): void => {
  console.log('\n==============================')
  console.log(title)
  console.log('==============================\n')
}

const getRandomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

const randomBool = (trueChance = 0.5): boolean => {
  return Math.random() < trueChance
}

const pickRandom = <T>(items: readonly T[]): T => {
  return items[getRandomInt(0, items.length - 1)]
}

const makeDateOffset = (daysOffset: number): Date => {
  const date = new Date()
  date.setDate(date.getDate() + daysOffset)
  return date
}

const buildPostState = (): {
  draft: boolean
  published: boolean
  staffPick: boolean
  featured: boolean
  publishTimestamp: Date | null
} => {
  const draft = randomBool(0.2)

  if (draft) {
    return {
      draft: true,
      published: false,
      staffPick: randomBool(0.15),
      featured: randomBool(0.15),
      publishTimestamp: null
    }
  }

  const published = randomBool(0.75)

  if (!published) {
    return {
      draft: false,
      published: false,
      staffPick: randomBool(0.1),
      featured: randomBool(0.1),
      publishTimestamp: null
    }
  }

  const isFutureScheduled = randomBool(0.2)
  const publishTimestamp = isFutureScheduled
    ? makeDateOffset(getRandomInt(1, 21))
    : makeDateOffset(getRandomInt(-90, -1))

  return {
    draft: false,
    published: true,
    staffPick: randomBool(0.25),
    featured: randomBool(0.2),
    publishTimestamp
  }
}

const buildPostContent = (postNumber: number): string => {
  return `
## Test Blog Post ${postNumber}

This is generated seed content for blog post ${postNumber}. It exists to test database queries, public filtering, cards, tiny records, pagination, and MDC rendering.

::blog-callout{title="Quick Tip ${postNumber}"}
This is reusable test content for post ${postNumber}. It helps verify custom content blocks render correctly.
::

### What this post can test

- Blog cards
- Tiny blog records
- Staff pick filtering
- Featured filtering
- Published filtering
- Draft filtering
- Future publish timestamp filtering

::blog-at-a-glance
- Generated post number ${postNumber}
- Useful for frontend testing
- Useful for API route testing
- Useful for pagination testing
::

### Notes

Every generated post shares a similar structure, but has unique metadata such as title, slug, and randomized state values.

::blog-references
- [Nuxt](https://nuxt.com/)
- [PostgreSQL](https://www.postgresql.org/)
::

## Final Thoughts

This is pseudo content for test post ${postNumber}, intended to make renderer and query validation easier.
  `.trim()
}

const buildSeedPosts = (): CreateBlogPostInput[] => {
  return Array.from({ length: TOTAL_TEST_POSTS }, (_, index) => {
    const postNumber = index + 1
    const paddedNumber = String(postNumber).padStart(3, '0')
    const state = buildPostState()
    const thumbnail = pickRandom(THUMBNAILS)
    const tags = pickRandom(TAG_GROUPS)

    return {
      id: `seed-blog-post-${paddedNumber}`,
      slug: `test-blog-post-${paddedNumber}`,
      title: `Test Blog Post ${postNumber}`,
      summary: `This is generated summary text for test blog post ${postNumber}, used for database and frontend rendering tests.`,
      content: buildPostContent(postNumber),
      author: pickRandom(AUTHORS),
      tags: [...tags],
      thumbnail: thumbnail.path,
      thumbnailAlt: `${thumbnail.alt} ${postNumber}`,
      thumbnailWidth: 1200,
      thumbnailHeight: 630,
      staffPick: state.staffPick,
      featured: state.featured,
      readTime: getRandomInt(2, 9),
      draft: state.draft,
      published: state.published,
      publishTimestamp: state.publishTimestamp,
      seoTitle: `Test Blog Post ${postNumber} | Seed Post`,
      seoDescription: `SEO description for generated test blog post ${postNumber}.`,
      seoImage: thumbnail.path,
      canonicalUrl: `https://www.goldengatemanor.com/blog/test-blog-post-${paddedNumber}`
    }
  })
}

const removeExistingSeedPosts = async (): Promise<void> => {
  logSection('REMOVING EXISTING SEED POSTS')

  for (const id of TEST_POST_IDS) {
    const existing = await getBlogPostById(id)

    if (!existing) {
      console.log(`Skipping ${id} (not found)`)
      continue
    }

    const deleted = await deleteBlogPost(id)
    console.log(`Deleted ${id}: ${deleted}`)
  }
}

const createSeedPosts = async (): Promise<void> => {
  logSection('CREATING SEED POSTS')

  const seedPosts = buildSeedPosts()

  for (const post of seedPosts) {
    const created = await createBlogPost(post)

    console.log(`Created: ${created.id}`)
    console.log(`  slug: ${created.slug}`)
    console.log(`  title: ${created.title}`)
    console.log(`  draft: ${created.draft}`)
    console.log(`  published: ${created.published}`)
    console.log(`  publish_timestamp: ${created.publish_timestamp}`)
    console.log(`  featured: ${created.featured}`)
    console.log(`  staff_pick: ${created.staff_pick}`)
    console.log('')
  }
}

const verifySeedPosts = async (): Promise<void> => {
  logSection('VERIFYING SEEDED POSTS')

  const allPosts = await listBlogPosts({
    orderField: 'created_at',
    orderDirection: 'desc'
  })

  const seededPosts = allPosts.filter(post =>
    TEST_POST_IDS.includes(post.id)
  )

  console.log(`Found ${seededPosts.length} seeded post(s)\n`)

  let draftCount = 0
  let publishedCount = 0
  let staffPickCount = 0
  let featuredCount = 0
  let futurePublishedCount = 0

  for (const post of seededPosts) {
    if (post.draft) draftCount += 1
    if (post.published) publishedCount += 1
    if (post.staff_pick) staffPickCount += 1
    if (post.featured) featuredCount += 1

    if (
      post.publish_timestamp &&
      new Date(post.publish_timestamp).getTime() > Date.now()
    ) {
      futurePublishedCount += 1
    }

    console.log(`ID: ${post.id}`)
    console.log(`Slug: ${post.slug}`)
    console.log(`Title: ${post.title}`)
    console.log(`Draft: ${post.draft}`)
    console.log(`Published: ${post.published}`)
    console.log(`Publish Timestamp: ${post.publish_timestamp}`)
    console.log(`Featured: ${post.featured}`)
    console.log(`Staff Pick: ${post.staff_pick}`)
    console.log(`Tags: ${post.tags.join(', ')}`)
    console.log('---')
  }

  logSection('SEED SUMMARY')
  console.log(`Total Seeded: ${seededPosts.length}`)
  console.log(`Draft: ${draftCount}`)
  console.log(`Published: ${publishedCount}`)
  console.log(`Staff Picks: ${staffPickCount}`)
  console.log(`Featured: ${featuredCount}`)
  console.log(`Future Publish Timestamp: ${futurePublishedCount}`)
  console.log('')
}

const main = async (): Promise<void> => {
  try {
    logSection('BLOG POST DB SEED TEST')

    await removeExistingSeedPosts()
    await createSeedPosts()
    await verifySeedPosts()

    logSection('DONE')
    console.log(`${TOTAL_TEST_POSTS} pseudo blog posts have been seeded successfully.\n`)
  } catch (error) {
    console.error('\nSeed test failed.\n')
    console.error(error)
    process.exitCode = 1
  }
}

void main()
import {
  createBlogPost,
  deleteBlogPost,
  getBlogPostById,
  listBlogPosts
} from './blogPosts.db'

import type { CreateBlogPostInput } from '../../../types/blogPosts'

const TOTAL_TEST_POSTS = 100

const TEST_POST_IDS = Array.from({ length: TOTAL_TEST_POSTS }, (_, index) =>
  `seed-blog-post-${String(index + 1).padStart(3, '0')}`
)

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

::PostAtAGlance
- **Post Number:** ${postNumber}
- **Purpose:** Full prose + MDC validation
- **Read Time:** ~10 minutes
- **Components Tested:** Callouts, CTA tiles, phone links, actions, references
- **Goal:** Simulate real production article behavior
::

::PleaseNote
This is a generated long-form test article used to validate rendering, spacing, and component behavior. It is not real-world advice.
::

## Test Post ${postNumber}: Full Rendering Validation

This article is intentionally dense. Its purpose is to simulate a real-world blog experience where multiple content types are layered together in a structured way.

A short article can look fine even if your system has problems. A long article exposes everything—spacing, hierarchy, responsiveness, and component behavior.

### Inline Component Testing

If you need help scheduling, call :phone-number{department="csr"}[].

For after-hours coordination, call :phone-number{department="dispatch"}[].

Testing custom formatting: :phone-number{department="other" number="719-555-1234"}[].

You can also test inline icons like :base-icon{name="mdi:check-circle" size="size-4" color="text-brand-primary" title="Check icon"}[] inside running text.

---

## Section One: Content Structure

A good article is not just text—it is structured information.

- **Headings guide navigation**
- **Lists improve readability**
- **Callouts highlight importance**
- **Actions drive engagement**

::PostCallout{title="Structure Insight"}
Content should feel organized even when it is dense. If it feels overwhelming, your spacing or hierarchy is off.
::

### Subsection: Reading Behavior

Users typically scan before they read.

1. Look at headings
2. Scan bold text
3. Check lists
4. Decide whether to continue

#### Why this matters

If your layout does not support scanning, your article loses effectiveness.

> A strong article reduces friction, not just delivers information.

---

## Section Two: Mixed Content Rendering

This section stacks multiple markdown types together.

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer posuere erat a ante venenatis dapibus.

### Unordered List

- First item
- Second item with [link](https://nuxt.com/)
- Third item with **bold text**
- Fourth item with inline icon :base-icon{name="mdi:check-circle" size="size-4" color="text-brand-primary" title="Check icon"}[]

### Ordered List

1. Step one
2. Step two
3. Step three
4. Step four

#### Paragraph After List

This paragraph exists to test spacing after lists. If this feels too tight or too far away, your prose spacing needs adjustment.

---

## Section Three: CTA and Action Testing

This section validates action-based components inside content.

::CenteredAction{to="/resources/schedule-a-ride" variant="primary" styling="px-4 py-2"}
Schedule a Ride Online
::

### CTA Tile Layout

::CenterLayoutFlex
  ::PostCtaTile{to="/news/blog/post/nemt-pueblo" name="mdi:ambulance" title="NEMT in Pueblo" message="How medical transportation works locally."}
  ::

  ::PostCtaTile{to="/news/blog/post/nemt-business" name="mdi:office-building" title="NEMT Business Guide" message="Understanding how providers operate."}
  ::

  ::PostCtaTile{to="/news/blog/post/medicaid-intro" name="mdi:hand-heart" title="Medicaid Overview" message="How Medicaid transportation works."}
  ::
::

#### Why this matters

This tests:

- nested components
- layout wrapping
- responsive behavior
- hover + interaction states

---

## Section Four: Deep Hierarchy

### H3 Section

Lorem ipsum dolor sit amet, consectetur adipiscing elit.

#### H4 Section

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum id ligula porta felis euismod semper.

### Another H3

Lorem ipsum dolor sit amet, consectetur adipiscing elit.

#### Another H4

Lorem ipsum dolor sit amet, consectetur adipiscing elit.

---

## Section Five: Long Reading Block

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer posuere erat a ante venenatis dapibus posuere velit aliquet.

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec sed odio dui. Cras justo odio, dapibus ac facilisis in.

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed posuere consectetur est at lobortis.

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur blandit tempus porttitor.

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean lacinia bibendum nulla sed consectetur. Vestibulum id ligula porta felis euismod semper.

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent commodo cursus magna, vel scelerisque nisl consectetur et.

---

## Section Six: Link Behavior

- [Nuxt](https://nuxt.com/)
- [Nuxt Content](https://content.nuxt.com/)
- [PostgreSQL](https://www.postgresql.org/)

::PostCallout{title="Link Styling"}
Links should be clear but not overwhelming.
::

---

## Final Thoughts

This article validates:

- typography hierarchy
- spacing consistency
- MDC component rendering
- inline component usage
- responsive layout behavior
- long-form readability

If you need one more inline render check before the article ends, call :phone-number{department="csr"}[] or show an inline icon :base-icon{name="mdi:phone" size="size-4" color="text-brand-primary" title="Phone icon"}[].

::PostReferences
- [Nuxt](https://nuxt.com/)
- [Nuxt Content](https://content.nuxt.com/)
- [PostgreSQL](https://www.postgresql.org/)
::

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
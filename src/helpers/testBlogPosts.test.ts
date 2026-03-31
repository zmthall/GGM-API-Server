const BASE_URL = 'http://127.0.0.1:4000/api/blog-posts'

const TEST_ID = 'route-test-blog-post'
const TEST_SLUG = 'route-test-blog-post'
const UPDATED_SLUG = 'route-test-blog-post-updated'

// Paste a valid Firebase ID token here for testing admin routes
const FIREBASE_TOKEN = ''

const getHeaders = (useAuth = false): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }

  if (useAuth) {
    if (!FIREBASE_TOKEN) {
      throw new Error('Missing FIREBASE_TOKEN for protected admin route test.')
    }

    headers.Authorization = `Bearer ${FIREBASE_TOKEN}`
  }

  return headers
}

const request = async (method: string, path: string, body?: unknown, useAuth = false) => {
  const url = `${BASE_URL}${path}`

  const res = await fetch(url, {
    method,
    headers: getHeaders(useAuth),
    ...(body ? { body: JSON.stringify(body) } : {})
  })

  let data: unknown

  try {
    data = await res.json()
  } catch {
    data = await res.text()
  }

  console.log(`\n${method} ${url}`)
  console.log(`STATUS: ${res.status}`)
  console.log(JSON.stringify(data, null, 2))

  return data
}

const run = async () => {
  try {
    console.log('\n==============================')
    console.log('HEALTH CHECK')
    console.log('==============================')
    await request('GET', '/route/health')

    console.log('\n==============================')
    console.log('CREATE POST')
    console.log('==============================')
    await request(
      'POST',
      '',
      {
        id: TEST_ID,
        slug: TEST_SLUG,
        title: 'Route Test Blog Post',
        summary: 'Testing routes for blog posts.',
        content: '## Test Content\n\nThis is a route test.',
        author: 'Zachary Thallas',
        tags: ['Test', 'Routes'],
        readTime: 5
      },
      true
    )

    console.log('\n==============================')
    console.log('ADMIN READ ROUTES')
    console.log('==============================')
    await request('GET', '/all', undefined, true)
    await request('GET', `/id/${TEST_ID}`, undefined, true)
    await request('GET', `/slug/${TEST_SLUG}`, undefined, true)

    console.log('\n==============================')
    console.log('CHECK UNIQUE')
    console.log('==============================')
    await request(
      'POST',
      '/check-unique',
      {
        post: {
          slug: TEST_SLUG
        }
      },
      true
    )

    console.log('\n==============================')
    console.log('UPDATE POST')
    console.log('==============================')
    await request(
      'PATCH',
      `/${TEST_ID}`,
      {
        title: 'Updated Route Test Blog Post',
        slug: UPDATED_SLUG
      },
      true
    )

    console.log('\n==============================')
    console.log('PUBLISH POST')
    console.log('==============================')
    await request(
      'PATCH',
      `/publish/${TEST_ID}`,
      {},
      true
    )

    console.log('\n==============================')
    console.log('PUBLIC ROUTES')
    console.log('==============================')
    await request('GET', '/latest')
    await request('GET', '/published')
    await request('GET', '/published/slugs')
    await request('GET', '/staff-picks')
    await request('GET', `/slug/${UPDATED_SLUG}/published`)
    await request('GET', `/related-posts/${TEST_ID}`)

    console.log('\n==============================')
    console.log('UNPUBLISH')
    console.log('==============================')
    await request(
      'PATCH',
      `/unpublish/${TEST_ID}`,
      undefined,
      true
    )

    console.log('\n==============================')
    console.log('DELETE POST')
    console.log('==============================')
    await request('DELETE', `/${TEST_ID}`, undefined, true)

    console.log('\n==============================')
    console.log('VERIFY DELETE')
    console.log('==============================')
    await request('GET', `/id/${TEST_ID}`, undefined, true)
    await request('GET', `/slug/${UPDATED_SLUG}`, undefined, true)
  } catch (error) {
    console.error('\nTEST FAILED')
    console.error(error)
  }
}

run()
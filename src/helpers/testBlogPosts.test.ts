const BASE_URL = 'http://127.0.0.1:4000/api/blog-posts'

const TEST_ID = 'route-test-blog-post'
const TEST_SLUG = 'route-test-blog-post'
const UPDATED_SLUG = 'route-test-blog-post-updated'

const request = async (method: string, path: string, body?: unknown) => {
  const url = `${BASE_URL}${path}`

  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json'
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  })

  let data

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

    await request('POST', '', {
      id: TEST_ID,
      slug: TEST_SLUG,
      title: 'Route Test Blog Post',
      summary: 'Testing routes for blog posts.',
      content: '## Test Content\n\nThis is a route test.',
      author: 'Zachary Thallas',
      tags: ['Test', 'Routes'],
      readTime: 5
    })

    console.log('\n==============================')
    console.log('ADMIN READ ROUTES')
    console.log('==============================')

    await request('GET', '/all')
    await request('GET', '/paginated')
    await request('GET', '/count')
    await request('GET', `/exists/id/${TEST_ID}`)
    await request('GET', `/exists/slug/${TEST_SLUG}`)
    await request('GET', `/id/${TEST_ID}`)
    await request('GET', `/slug/${TEST_SLUG}`)

    console.log('\n==============================')
    console.log('UPDATE POST')
    console.log('==============================')

    await request('PATCH', `/${TEST_ID}`, {
      title: 'Updated Route Test Blog Post',
      slug: UPDATED_SLUG
    })

    console.log('\n==============================')
    console.log('PUBLISH POST')
    console.log('==============================')

    await request('PATCH', `/${TEST_ID}/publish`, {})

    console.log('\n==============================')
    console.log('PUBLIC ROUTES')
    console.log('==============================')

    await request('GET', '/latest')
    await request('GET', '/published')
    await request('GET', '/published/slugs')
    await request('GET', '/featured')
    await request('GET', '/staff-picks')
    await request('GET', '/tag/Test')
    await request('GET', '/author/Zachary%20Thallas')
    await request('GET', `/slug/${UPDATED_SLUG}/published`)

    console.log('\n==============================')
    console.log('FEATURED / STAFF PICK')
    console.log('==============================')

    await request('PATCH', `/${TEST_ID}/featured`, { featured: true })
    await request('PATCH', `/${TEST_ID}/featured/toggle`)
    await request('PATCH', `/${TEST_ID}/staff-pick`, { staffPick: true })
    await request('PATCH', `/${TEST_ID}/staff-pick/toggle`)

    console.log('\n==============================')
    console.log('DRAFT TESTS')
    console.log('==============================')

    await request('PATCH', `/${TEST_ID}/draft`, { draft: true })
    await request('PATCH', `/${TEST_ID}/draft/toggle`)

    console.log('\n==============================')
    console.log('UNPUBLISH')
    console.log('==============================')

    await request('PATCH', `/${TEST_ID}/unpublish`)

    console.log('\n==============================')
    console.log('DELETE POST')
    console.log('==============================')

    await request('DELETE', `/${TEST_ID}`)

    console.log('\n==============================')
    console.log('VERIFY DELETE')
    console.log('==============================')

    await request('GET', `/exists/id/${TEST_ID}`)
    await request('GET', `/slug/${UPDATED_SLUG}`)

  } catch (error) {
    console.error('\nTEST FAILED')
    console.error(error)
  }
}

run()
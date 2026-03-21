import { Router } from 'express'
import { blogPostsController } from '../controllers/blogPosts.controller'

const router = Router()

router.get('/route/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Blog post routes are working.'
  })
})

/**
 * Public read routes
 */
router.get('/latest', blogPostsController.getLatest)
router.get('/published', blogPostsController.fetchAllPublished)
router.get('/published/slugs', blogPostsController.listPublishedSlugs)
router.get('/featured', blogPostsController.listFeatured)
router.get('/staff-picks', blogPostsController.listStaffPicks)
router.get('/related-posts/:id', blogPostsController.listRelatedPosts)


router.get('/tag/:tag', blogPostsController.listByTag)
router.get('/author/:author', blogPostsController.listByAuthor)
router.get('/slug/:slug/published', blogPostsController.getPublishedBySlug)
router.get('/exists/slug/:slug/published', blogPostsController.existsPublishedBySlug)

/**
 * Admin read routes
*/
router.get('/all', blogPostsController.fetchAll)
router.get('/id/:id', blogPostsController.getById)


router.get('/slug/:slug', blogPostsController.getBySlug)
router.get('/exists/slug/:slug', blogPostsController.existsBySlug)
router.get('/paginated', blogPostsController.listPaginated)
router.get('/count', blogPostsController.count)
router.get('/exists/id/:id', blogPostsController.existsById)

/**
 * Admin write routes
 */
router.post('/', blogPostsController.create)
router.patch('/publish/:id', blogPostsController.publish)
router.delete('/:id', blogPostsController.remove)

router.patch('/:id', blogPostsController.update)
router.patch('/unpublish/:id', blogPostsController.unpublish)

router.patch('/:id/draft', blogPostsController.setDraft)
router.patch('/:id/draft/toggle', blogPostsController.toggleDraft)

router.patch('/:id/featured', blogPostsController.setFeatured)
router.patch('/:id/featured/toggle', blogPostsController.toggleFeatured)

router.patch('/:id/staff-pick', blogPostsController.setStaffPick)
router.patch('/:id/staff-pick/toggle', blogPostsController.toggleStaffPick)

export default router
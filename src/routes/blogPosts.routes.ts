import { Router } from 'express'
import { blogPostsController } from '../controllers/blogPosts.controller'
import multer from 'multer'

// MIDDLEWARE
import { verifyFirebaseToken } from '../middlewares/verifyFirebaseToken'

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
router.get('/staff-picks', blogPostsController.listStaffPicks)
router.get('/related-posts/:id', blogPostsController.listRelatedPosts)
router.get('/slug/:slug/published', blogPostsController.getPublishedBySlug)

/**
 * Admin read routes
*/
router.get('/all', verifyFirebaseToken, blogPostsController.fetchAll)
router.get('/id/:id', verifyFirebaseToken, blogPostsController.getById)
router.get('/slug/:slug', verifyFirebaseToken, blogPostsController.getBySlug)
router.post('/check-unique', verifyFirebaseToken, blogPostsController.checkUniquePost)


/**
 * Admin editing routes
*/
router.post('/', verifyFirebaseToken, blogPostsController.create)
router.patch('/publish/:id', verifyFirebaseToken, blogPostsController.publish)
router.delete('/:id', verifyFirebaseToken, blogPostsController.remove)
router.patch('/:id', verifyFirebaseToken, blogPostsController.update)

router.patch('/unpublish/:id', verifyFirebaseToken, blogPostsController.unpublish)

/**
 * Admin Media Routes
*/
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
})

router.post('/upload-thumbnail', verifyFirebaseToken, upload.single('thumbnailImage'), blogPostsController.uploadThumbnail)
router.post('/upload-seo', verifyFirebaseToken, upload.single('seoImage'), blogPostsController.uploadSeo)

export default router
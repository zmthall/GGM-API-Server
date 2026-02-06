import { Router } from 'express'
import {
  listBlogCalendars,
  getBlogCalendarByKey,
  upsertBlogCalendar,
  deleteBlogCalendar
} from '../controllers/blogCalendar.controller'

import { verifyFirebaseToken } from '../middlewares/verifyFirebaseToken'

const router = Router()

router.get('/route/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Blog Calendar Routes are working.' })
})

// Admin-only
router.get('/', verifyFirebaseToken, listBlogCalendars)
router.get('/:key', verifyFirebaseToken, getBlogCalendarByKey)
router.put('/:key', verifyFirebaseToken, upsertBlogCalendar)
router.delete('/:key', verifyFirebaseToken, deleteBlogCalendar)

export default router

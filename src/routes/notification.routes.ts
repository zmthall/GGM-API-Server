import { Router } from 'express'
import { getNotifications, incrementNotifications, decrementNotifications } from '../controllers/notification.controller'

const router = Router()

router.get('/route/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Notification routes are working.' })
})

router.get('/', getNotifications)

// Param-based (optional convenience)
router.put('/:type/increment', incrementNotifications)
router.put('/:type/decrement', decrementNotifications)

// Body-based
router.put('/increment', incrementNotifications)
router.put('/decrement', decrementNotifications)


export default router
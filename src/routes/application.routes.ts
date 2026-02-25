import { Router } from 'express'
import multer from 'multer'
import {
  submitApplication,
  getAllApplications,
  getApplicationById,
  updateApplicationStatus,
  updateApplicationTags,
  deleteApplication,
  createApplicationPacketPDFById,
  createApplicationPacketPDFBulk
} from '../controllers/application.controller'

import { verifyFirebaseToken } from '../middlewares/verifyFirebaseToken'

const router = Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
})

router.get('/route/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Application Routes are working.' })
})

router.post('/submit', upload.any(), submitApplication)

// ✅ match rideRequest route style
router.get('/export/pdf/bulk', verifyFirebaseToken, createApplicationPacketPDFBulk)
router.get('/export/pdf/:id', verifyFirebaseToken, createApplicationPacketPDFById)

router.get('/', verifyFirebaseToken, getAllApplications)
router.get('/:id', verifyFirebaseToken, getApplicationById)
router.put('/:id/status', verifyFirebaseToken, updateApplicationStatus)
router.put('/:id/tags', verifyFirebaseToken, updateApplicationTags)
router.delete('/:id', verifyFirebaseToken, deleteApplication)

export default router
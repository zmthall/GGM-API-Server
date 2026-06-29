import { Router } from 'express';

import {
    submitConsultationForm,
    getAllConsultationRequests,
    getConsultationRequestById,
    // getConsultationRequestsByDate,
    updateConsultationRequestStatus,
    deleteConsultationRequest,
    updateConsultationRequestTags,
    createConsultationRequestPDFById
} from '../controllers/consultation.controller';

const router = Router();

// Middleware
import { verifyFirebaseToken } from '../middlewares/verifyFirebaseToken';

router.get('/route/health', (_req, res) => {
    res.status(200).json({ status: 'OK', message: 'Contact Form routes are working.' });
})

// Public routes
router.post('/submit', submitConsultationForm);

// Admin routes
router.get('/', verifyFirebaseToken, getAllConsultationRequests)
router.get('/:id', verifyFirebaseToken, getConsultationRequestById)
router.get('/export/pdf/:id', verifyFirebaseToken, createConsultationRequestPDFById)
router.put('/:id/status', verifyFirebaseToken, updateConsultationRequestStatus)
router.put('/:id/tags', verifyFirebaseToken, updateConsultationRequestTags)
router.delete('/:id', verifyFirebaseToken, deleteConsultationRequest)

export default router;
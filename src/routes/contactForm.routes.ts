// /routes/contactForm.routes.ts
import { Router } from 'express';
import { 
    getAllContactForms,
    getContactFormById,
    getContactFormsByDate,
    updateContactFormStatus,
    deleteContactForm,
    addTagsToContactForm,
    createContactFormPDFById,
    createContactFormPDFBulk,
    getContactFormsByDateRange,
    getContactFormsByStatus
} from '../controllers/contactForm.controller';

const router = Router();

// Middleware
import { verifyFirebaseToken } from '../middlewares/verifyFirebaseToken';

router.get('/route/health', (_req, res) => {
    res.status(200).json({ status: 'OK', message: 'Contact Form routes are working.' });
})

router.get('/export/pdf/bulk', verifyFirebaseToken, createContactFormPDFBulk)

router.get('/export/pdf/:id', verifyFirebaseToken, createContactFormPDFById)

router.get('/', verifyFirebaseToken, getAllContactForms);

router.get('/date/:date', verifyFirebaseToken, getContactFormsByDate);

router.get('/:id', verifyFirebaseToken, getContactFormById);

router.get('/date-range/:startDate/:endDate', verifyFirebaseToken, getContactFormsByDateRange)

router.get('/status/:status', verifyFirebaseToken, getContactFormsByStatus)

router.put('/:id/status', verifyFirebaseToken, updateContactFormStatus)

router.put('/:id/tags', verifyFirebaseToken, addTagsToContactForm)

router.delete('/:id', verifyFirebaseToken, deleteContactForm)

export default router;
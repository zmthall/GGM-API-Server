// /routes/jobs.routes.ts
import { Router } from 'express';
import { 
    getAllContactForms,
    getContactFormById,
    getContactFormsByDate,
    updateContactFormStatus,
    deleteContactForm,
    addTagsToContactForm
} from '../controllers/contactForm.controller';

const router = Router();

// Middleware
import { authenticateKey } from '../middlewares/authenticateKey';

router.get('/route/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Contact Form routes are working.' });
})

router.get('/', authenticateKey, getAllContactForms);

router.get('/date/:date', authenticateKey, getContactFormsByDate);

router.get('/:id', authenticateKey, getContactFormById);

router.put('/:id/status', authenticateKey, updateContactFormStatus)

router.put('/:id/tags', authenticateKey, addTagsToContactForm)

router.delete('/:id', authenticateKey, deleteContactForm)

export default router;
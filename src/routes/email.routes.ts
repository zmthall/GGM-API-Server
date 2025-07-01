// /routes/email.routes.ts
import { Router } from 'express';
import { sendSingleEmail, sendBulkEmails, verifyEmailConnection, sendContactFormEmail, sendRideRequestEmail } from '../controllers/email.controller';

const router = Router();

// Middleware (uncomment if needed)
import { authenticateKey } from '../middlewares/authenticateKey';

// Send single email (auth required)
router.post('/send', authenticateKey, sendSingleEmail);

// Send bulk emails (auth required)
router.post('/send/bulk', authenticateKey, sendBulkEmails);

// Send contact form email (no auth needed for public contact forms)
router.post('/contact-form', sendContactFormEmail);

// Send ride request contact form email (no auth needed for public contact forms)
router.post('/ride-request', sendRideRequestEmail);

// Verify email service connection
router.get('/verify', verifyEmailConnection);

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Email routes are working.' 
  });
});

export default router;
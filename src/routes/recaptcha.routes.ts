import { Router } from 'express';
import { verifyRecaptcha } from '../controllers/recaptcha.controller';

const router = Router();

// Middleware
// import { authenticateKey } from '../middlewares/authenticateKey';

router.post('/verify', verifyRecaptcha);

router.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Recaptcha Routes are working.' });
})

export default router;
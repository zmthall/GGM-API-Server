// /routes/security.routes.ts
import { Router } from 'express';
import { decrypt, encrypt } from '../controllers/crypto.controller';

const router = Router();

// Middleware
// import { authenticateKey } from '../middlewares/authenticateKey';

router.post('/encrypt', encrypt);
router.post('/decrypt', decrypt);

router.get('/route/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Job Routes are working.' });
})

export default router;
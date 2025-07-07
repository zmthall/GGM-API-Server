// /routes/jobs.routes.ts
import { Router } from 'express';
import { getJobDescriptionByField } from '../controllers/job.controller';

const router = Router();

// Middleware
// import { authenticateKey } from '../middlewares/authenticateKey';

router.get('/:select', getJobDescriptionByField);

router.get('/route/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Job Routes are working.' });
})

export default router;
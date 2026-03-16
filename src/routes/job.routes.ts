// /routes/jobs.routes.ts
import { Router } from 'express';
import { getJobDescriptionByField } from '../controllers/job.controller';

const router = Router();

router.get('/:select', getJobDescriptionByField);

router.get('/route/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Job Routes are working.' });
})

export default router;
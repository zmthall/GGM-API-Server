import { Router } from 'express';
import { getJobDescriptionByField } from '../controllers/job.controller';

const router = Router();

// Middleware
import { authenticateKey } from '../middlewares/authenticateKey';

router.get('/:select', getJobDescriptionByField);

export default router;
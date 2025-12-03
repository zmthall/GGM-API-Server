import { Router } from 'express';

import {
  verifyLogin
} from '../controllers/verify.controller';

const router = Router();

// Middleware
import { verifyFirebaseToken } from '../middlewares/verifyFirebaseToken';

router.post('/admin', verifyFirebaseToken, verifyLogin)

export default router;
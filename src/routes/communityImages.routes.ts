// /routes/houses.routes.ts
import { Router } from 'express';
import { getCommunityImages, getCommunityManifest, rebuildCommunityManifest } from '../controllers/communityImages.controller';

const router = Router();

// Middleware
// import { authenticateKey } from '../middlewares/authenticateKey';

router.post('/images/rebuild-manifest', rebuildCommunityManifest);
router.get('/images/manifest', getCommunityManifest)
router.get('/images', getCommunityImages);



router.get('/route/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Community image routes are working.' });
})

export default router;
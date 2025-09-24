// /routes/houses.routes.ts
import { Router } from 'express';
import { rebuildAllManifests, getHouseImages, getCombinedManifest } from '../controllers/houses.controller';

const router = Router();

// Middleware
// import { authenticateKey } from '../middlewares/authenticateKey';

router.get('/images/manifest', getCombinedManifest)
router.get('/images/:houseId', getHouseImages);


router.post('/images/rebuild-manifest', rebuildAllManifests);

router.get('/route/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'House Image Routes are working.' });
})

export default router;
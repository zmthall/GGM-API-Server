// /routes/media.routes.ts
import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

// Middleware
import { authenticateKey } from '../middlewares/authenticateKey';

// Instantiation of router
const router = express.Router();

// Community Media
import { uploadCommunityMedia, deleteCommunityImage, getCommunityImages } from '../controllers/media.controller';

// GET - http://127.0.0.1:4000/api/media/community-upload | Gets all images and alts in the folder for community images
// POST - http://127.0.0.1:4000/api/media/community-upload | Key: single || multi | FormData: File | Image value | Adds image/images to the community images file
// DELETE - http://127.0.0.1:4000/api/media/delete-upload/:uuid | Deletes image from community images file with specific image UUID label
router.get('/community-upload', getCommunityImages);

// Multer setup for Community Media Uploading
const communityStorage = multer.diskStorage({
    destination: 'uploads/community/images/',
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname); // preserve original file extension
        const uniqueName = `${uuidv4()}${ext}`;
        cb(null, uniqueName);
    }
});

const communityUpload = multer({ storage: communityStorage });

router.post('/community-upload', authenticateKey, communityUpload.fields([
    { name: 'single', maxCount: 1 },
    { name: 'multi', maxCount: 25 }
]), uploadCommunityMedia);

router.delete('/delete-upload/:uuid', authenticateKey, deleteCommunityImage);

// Shown Community Media
const tempUpload = multer({ dest: 'uploads/temp/' });

import { getCommunityShown, updateCommunityShown, deleteCommunityShownMedia, deleteAllCommunityShownImages } from '../controllers/mediaShown.controller';

// GET - http://127.0.0.1:4000/api/media/community-shown | Gets all shown media slots and alts
// PUT - http://127.0.0.1:4000/api/media/community-shown/:slot | Updates specific slot locations with other images
// DELETE - http://127.0.0.1:4000/api/media/delete-shown/:slot | Deletes specific slot files and .json files
// DELETE - http://127.0.0.1:4000/api/media/community/delete-shown/all | Deletes all slot files and .json files
router.get('/community-shown', getCommunityShown);
router.put('/community-shown/:slot', authenticateKey, tempUpload.single('file'), updateCommunityShown);
router.delete('/delete-shown/:slot', authenticateKey, deleteCommunityShownMedia);
router.delete('/community/delete-shown/all', authenticateKey, deleteAllCommunityShownImages);

router.get('/route/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Media Routes are working.' });
})

export default router;
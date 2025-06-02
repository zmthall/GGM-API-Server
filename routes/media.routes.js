import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

// Middleware and controllers
import { uploadCommunityMedia } from '../controllers/media.controller.js';
import { authenticateKey } from '../middlewares/authenticateKey.js';

// Instantiation of router
const router = express.Router();

// Multer setup/usecase
const communityStorage = multer.diskStorage({
    destination: 'uploads/community/',
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname); // preserve original file extension
        const uniqueName = `${uuidv4()}${ext}`;
        cb(null, uniqueName);
    }
});

const tempUpload = multer({ dest: 'uploads/temp/' });

// const communityShownStorage = multer.diskStorage({
//     destination: 'uploads/community/shown/',
//     filename: (req, file, cb) => {
//         const ext = path.extname(file.originalname); // preserve original file extension
//         const uniqueName = `${uuidv4()}${ext}`;
//         cb(null, uniqueName);
//     }
// });

const communityUpload = multer({ storage: communityStorage });

router.post('/community-upload', authenticateKey, communityUpload.fields([
    { name: 'single', maxCount: 1 },
    { name: 'multi', maxCount: 25 }
]), uploadCommunityMedia);

import { getCommunityShown, updateCommunityShown, deleteCommunityShownMedia, deleteAllCommunityShownImages } from '../controllers/mediaShown.controller.js';

router.get('/community-shown', getCommunityShown);
router.put('/community-shown/:slot', authenticateKey, tempUpload.single('file'), updateCommunityShown);
router.delete('/delete-shown/:slot', authenticateKey, deleteCommunityShownMedia);
router.delete('/community/delete-shown/all', authenticateKey, deleteAllCommunityShownImages);

// Error handler for Multer-specific errors
router.use((err, req, res, next) => {
  console.log(req.files)
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      message: 'Multer upload error',
      error: err.message,
    });
  }
  next(err); // fallback
});

export default router;
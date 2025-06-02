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

const communityUpload = multer({ storage: communityStorage });

router.post('/community-upload', authenticateKey, communityUpload.single('file'), uploadCommunityMedia);

export default router;
// /routes/application.routes.ts
import { Router } from 'express';
import multer from 'multer';
// import { submitApplication } from '../controllers/application.controller';

const router = Router();

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    }
});

// router.post('/submit', upload.any(), submitApplication);

router.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        message: 'Application Routes are working.' 
    });
});